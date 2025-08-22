import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { networkId, marketCode } = await req.json();

    console.log(`Syncing affiliate network: ${networkId} for market: ${marketCode}`);

    // Get network configuration
    const { data: network, error: networkError } = await supabaseClient
      .from('affiliate_networks')
      .select('*')
      .eq('id', networkId)
      .single();

    if (networkError || !network) {
      throw new Error('Affiliate network not found');
    }

    // Get API key from Supabase secrets
    const apiKey = Deno.env.get(network.api_key_name);
    if (!apiKey) {
      throw new Error(`API key ${network.api_key_name} not found in secrets`);
    }

    // Start import log
    const { data: importLog, error: logError } = await supabaseClient
      .from('import_logs')
      .insert({
        network_id: networkId,
        import_type: 'affiliate_api',
        status: 'processing'
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating import log:', logError);
      throw logError;
    }

    let productsProcessed = 0;
    let productsCreated = 0;
    let productsUpdated = 0;
    const errors: string[] = [];

    // Fetch products from affiliate API
    const apiUrl = network.api_endpoint;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Add API key to headers (different networks use different header names)
    if (network.config.auth_header) {
      headers[network.config.auth_header] = apiKey;
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // Add market-specific parameters
    const urlParams = new URLSearchParams();
    if (network.config.market_param) {
      urlParams.set(network.config.market_param, marketCode);
    }
    if (network.config.limit) {
      urlParams.set('limit', network.config.limit.toString());
    }

    const fullUrl = urlParams.toString() ? `${apiUrl}?${urlParams.toString()}` : apiUrl;
    
    console.log(`Fetching from: ${fullUrl}`);

    const response = await fetch(fullUrl, { headers });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract products array from response (different APIs structure differently)
    const products = data.products || data.items || data.data || data;
    
    if (!Array.isArray(products)) {
      throw new Error('Invalid API response: products array not found');
    }

    for (const apiProduct of products) {
      try {
        productsProcessed++;

        // Map API fields to our schema using network configuration
        const mapping = network.config.field_mapping || {};
        
        const title = apiProduct[mapping.title || 'title'] || apiProduct.name;
        const description = apiProduct[mapping.description || 'description'];
        const price = parseFloat(apiProduct[mapping.price || 'price'] || '0');
        const originalPrice = parseFloat(apiProduct[mapping.original_price || 'original_price'] || '0');
        const currency = apiProduct[mapping.currency || 'currency'] || 'EUR';
        const imageUrl = apiProduct[mapping.image_url || 'image_url'] || apiProduct.image;
        const categoryName = apiProduct[mapping.category || 'category'] || apiProduct.category_name;
        const shopName = apiProduct[mapping.shop || 'shop'] || apiProduct.merchant || network.name;
        const availability = apiProduct[mapping.availability || 'availability'] || 'in_stock';
        const affiliateUrl = apiProduct[mapping.affiliate_url || 'affiliate_url'] || apiProduct.link;

        if (!title || !imageUrl || price <= 0) {
          errors.push(`Invalid product data: missing title, image, or price for product ${apiProduct.id || 'unknown'}`);
          continue;
        }

        // Find or create shop
        let shopId = null;
        if (shopName) {
          const { data: existingShop } = await supabaseClient
            .from('shops')
            .select('id')
            .eq('name', shopName)
            .eq('market_code', marketCode)
            .single();

          if (existingShop) {
            shopId = existingShop.id;
          } else {
            const { data: newShop } = await supabaseClient
              .from('shops')
              .insert({
                name: shopName,
                market_code: marketCode
              })
              .select('id')
              .single();
            shopId = newShop?.id;
          }
        }

        // Find or create category
        let categoryId = null;
        if (categoryName) {
          const { data: existingCategory } = await supabaseClient
            .from('categories')
            .select('id')
            .eq('name', categoryName)
            .eq('market_code', marketCode)
            .single();

          if (existingCategory) {
            categoryId = existingCategory.id;
          } else {
            const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const { data: newCategory } = await supabaseClient
              .from('categories')
              .insert({
                name: categoryName,
                slug: categorySlug,
                market_code: marketCode
              })
              .select('id')
              .single();
            categoryId = newCategory?.id;
          }
        }

        // Check if product already exists (by external ID or title)
        const externalId = apiProduct[mapping.external_id || 'id'];
        let existingProduct = null;

        if (externalId) {
          const { data } = await supabaseClient
            .from('products')
            .select('id')
            .eq('external_id', externalId)
            .eq('market_code', marketCode)
            .single();
          existingProduct = data;
        }

        if (!existingProduct) {
          const { data } = await supabaseClient
            .from('products')
            .select('id')
            .eq('title', title)
            .eq('market_code', marketCode)
            .single();
          existingProduct = data;
        }

        const productData = {
          title,
          description,
          price,
          original_price: originalPrice || null,
          currency,
          image_url: imageUrl,
          category_id: categoryId,
          shop_id: shopId,
          market_code: marketCode,
          availability,
          external_id: externalId
        };

        if (existingProduct) {
          // Update existing product
          await supabaseClient
            .from('products')
            .update(productData)
            .eq('id', existingProduct.id);
          productsUpdated++;
        } else {
          // Create new product
          const { data: newProduct } = await supabaseClient
            .from('products')
            .insert(productData)
            .select('id')
            .single();

          if (newProduct && affiliateUrl) {
            // Create affiliate link
            await supabaseClient
              .from('affiliate_links')
              .insert({
                product_id: newProduct.id,
                affiliate_url: affiliateUrl
              });
          }
          productsCreated++;
        }

      } catch (error) {
        errors.push(`Error processing product: ${error.message}`);
        console.error('Product processing error:', error);
      }
    }

    // Update import log
    await supabaseClient
      .from('import_logs')
      .update({
        status: errors.length > productsProcessed / 2 ? 'failed' : 'completed',
        products_processed: productsProcessed,
        products_created: productsCreated,
        products_updated: productsUpdated,
        errors: errors,
        completed_at: new Date().toISOString()
      })
      .eq('id', importLog.id);

    // Update network last sync timestamp
    await supabaseClient
      .from('affiliate_networks')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', networkId);

    console.log(`Sync completed: ${productsCreated} created, ${productsUpdated} updated, ${errors.length} errors`);

    return new Response(JSON.stringify({
      success: true,
      productsProcessed,
      productsCreated,
      productsUpdated,
      errors: errors.slice(0, 10) // Return first 10 errors
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in affiliate-api-sync function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});