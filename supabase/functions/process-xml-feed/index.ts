import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Product {
  title: string;
  description?: string;
  price: number;
  original_price?: number;
  currency: string;
  image_url: string;
  category_name?: string;
  shop_name?: string;
  availability?: string;
  affiliate_url?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { feedId, feedUrl, marketCode, mappingConfig } = await req.json();

    console.log(`Processing XML feed: ${feedUrl} for market: ${marketCode}`);

    // Start import log
    const { data: importLog, error: logError } = await supabaseClient
      .from('import_logs')
      .insert({
        feed_id: feedId,
        import_type: 'xml_feed',
        status: 'processing'
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating import log:', logError);
      throw logError;
    }

    // Fetch XML feed
    const response = await fetch(feedUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch XML feed: ${response.statusText}`);
    }

    const xmlText = await response.text();
    
    // Parse XML (simple parsing - in production, use a proper XML parser)
    const products: Product[] = [];
    let productsProcessed = 0;
    let productsCreated = 0;
    let productsUpdated = 0;
    const errors: string[] = [];

    // Basic XML parsing - extract product elements
    const productMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/g) || 
                          xmlText.match(/<product[^>]*>[\s\S]*?<\/product>/g) || [];

    for (const productXml of productMatches) {
      try {
        productsProcessed++;

        // Extract data using regex (in production, use proper XML parser)
        const title = extractXmlValue(productXml, mappingConfig.title || 'title');
        const description = extractXmlValue(productXml, mappingConfig.description || 'description');
        const price = parseFloat(extractXmlValue(productXml, mappingConfig.price || 'price') || '0');
        const originalPrice = parseFloat(extractXmlValue(productXml, mappingConfig.original_price || 'original_price') || '0');
        const currency = extractXmlValue(productXml, mappingConfig.currency || 'currency') || 'EUR';
        const imageUrl = extractXmlValue(productXml, mappingConfig.image_url || 'image_url');
        const categoryName = extractXmlValue(productXml, mappingConfig.category || 'category');
        const shopName = extractXmlValue(productXml, mappingConfig.shop || 'shop');
        const availability = extractXmlValue(productXml, mappingConfig.availability || 'availability') || 'in_stock';
        const affiliateUrl = extractXmlValue(productXml, mappingConfig.affiliate_url || 'link');

        if (!title || !imageUrl || price <= 0) {
          errors.push(`Invalid product data: missing title, image, or price`);
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

        // Check if product already exists
        const { data: existingProduct } = await supabaseClient
          .from('products')
          .select('id')
          .eq('title', title)
          .eq('market_code', marketCode)
          .single();

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
          availability
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

        products.push({
          title,
          description,
          price,
          original_price: originalPrice,
          currency,
          image_url: imageUrl,
          category_name: categoryName,
          shop_name: shopName,
          availability,
          affiliate_url: affiliateUrl
        });

      } catch (error) {
        errors.push(`Error processing product: ${error.message}`);
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

    // Update feed last imported timestamp
    await supabaseClient
      .from('xml_feeds')
      .update({ last_imported_at: new Date().toISOString() })
      .eq('id', feedId);

    console.log(`Import completed: ${productsCreated} created, ${productsUpdated} updated, ${errors.length} errors`);

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
    console.error('Error in process-xml-feed function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function extractXmlValue(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}