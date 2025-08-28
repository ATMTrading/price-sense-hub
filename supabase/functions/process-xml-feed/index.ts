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

    // Support both old format (feed_id) and new format (all parameters)
    let feedId, feedUrl, marketCode, mappingConfig, affiliateLinkTemplate, limit;
    
    const requestBody = await req.json();
    console.log('Request body received:', JSON.stringify(requestBody, null, 2));
    
    if (requestBody.feed_id) {
      // Old format - fetch feed details
      console.log(`Processing XML feed with ID: ${requestBody.feed_id}`);
      
      const { data: feed, error: feedError } = await supabaseClient
        .from('xml_feeds')
        .select('*')
        .eq('id', requestBody.feed_id)
        .single();
      
      if (feedError || !feed) {
        throw new Error('Feed not found');
      }
      
      feedId = feed.id;
      feedUrl = feed.url;
      marketCode = feed.market_code;
      mappingConfig = feed.mapping_config;
      affiliateLinkTemplate = feed.affiliate_link_template;
    } else {
      // New format - use provided parameters
      ({ feedId, feedUrl, marketCode, mappingConfig, affiliateLinkTemplate, limit } = requestBody);
    }

    console.log(`Processing XML feed: ${feedUrl} for market: ${marketCode}${limit ? ` (limit: ${limit})` : ''}`);
    
    // Start import log
    const { data: importLog, error: logError } = await supabaseClient
      .from('import_logs')
      .insert({
        feed_id: feedId,
        import_type: limit ? 'test_import' : 'xml_feed',
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
    const productMatches = xmlText.match(/<product[^>]*>[\s\S]*?<\/product>/g) || 
                          xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/g) || [];

    console.log(`Found ${productMatches.length} products in XML`);
    
    // Debug: Log first product structure if available
    if (productMatches.length > 0) {
      console.log('First product XML structure:', productMatches[0].substring(0, 500));
    }

    // Limit products for testing
    const productsToProcess = limit ? productMatches.slice(0, limit) : productMatches;

    for (const productXml of productsToProcess) {
      try {
        productsProcessed++;

        // Debug: Always log the first product's raw XML structure
        if (productsProcessed === 1) {
          console.log('=== FIRST PRODUCT DEBUG ===');
          console.log('Raw XML (first 2000 chars):', productXml.substring(0, 2000));
          console.log('Full XML length:', productXml.length);
          
          // Find all tags in this product
          const allTags = [...productXml.matchAll(/<([^\/\s>]+)/g)];
          console.log('All XML tags found:', allTags.map(m => m[1]).slice(0, 30));
        }

        // Extract data using regex (in production, use proper XML parser)
        const title = extractXmlValue(productXml, mappingConfig.title || 'title');
        const description = extractXmlValue(productXml, mappingConfig.description || 'description');
        const price = parseFloat(extractXmlValue(productXml, mappingConfig.price || 'price') || '0');
        const originalPrice = parseFloat(extractXmlValue(productXml, mappingConfig.original_price || 'original_price') || '0');
        // Set currency based on market code
        let currency = 'EUR'; // default
        if (marketCode === 'hu') currency = 'HUF';
        else if (marketCode === 'cz') currency = 'CZK';
        else if (marketCode === 'sk') currency = 'EUR';
        else if (marketCode === 'pl') currency = 'PLN';
        
        // Override with XML value if available
        const xmlCurrency = extractXmlValue(productXml, mappingConfig.currency || 'currency');
        if (xmlCurrency) currency = xmlCurrency;
        const imageUrl = extractXmlValue(productXml, mappingConfig.image_url || 'image_url');
        const categoryName = extractXmlValue(productXml, mappingConfig.category || 'category');
        const shopName = extractXmlValue(productXml, mappingConfig.shop || 'shop');
        const availability = extractXmlValue(productXml, mappingConfig.availability || 'availability') || 'in_stock';
        const productUrl = extractXmlValue(productXml, mappingConfig.product_url || 'link');

        // Debug logging for first product
        if (productsProcessed === 1) {
          console.log('Debug - Mapping config:', JSON.stringify(mappingConfig, null, 2));
          console.log('Debug - Extracted title:', title);
          console.log('Debug - Extracted price:', price);
          console.log('Debug - Extracted imageUrl:', imageUrl);
          console.log('Debug - Title field lookup:', mappingConfig.title || 'title');
          console.log('Debug - Price field lookup:', mappingConfig.price || 'price');
        }

         // Find or create shop with affiliate parameters
        let shopId = null;
        let shop = null;
        if (shopName) {
          const { data: existingShop } = await supabaseClient
            .from('shops')
            .select('id, affiliate_params')
            .eq('name', shopName)
            .eq('market_code', marketCode)
            .single();

          if (existingShop) {
            shopId = existingShop.id;
            shop = existingShop;
          } else {
            const { data: newShop } = await supabaseClient
              .from('shops')
              .insert({
                name: shopName,
                market_code: marketCode
              })
              .select('id, affiliate_params')
              .single();
            shopId = newShop?.id;
            shop = newShop;
          }
        }

        // Generate affiliate URL with shop-specific parameters
        let affiliateUrl = null;
        if (productUrl && shop && shop.affiliate_params) {
          const shopAffiliateParams = shop.affiliate_params || {};
          const utmSource = shopAffiliateParams.utm_source || 'dognet'; // Default to dognet
          const aCid = shopAffiliateParams.a_cid || '908fbcd7'; // Default value
          
          // Global affiliate parameters
          const globalParams = {
            utm_medium: 'affiliate',
            utm_campaign: '68b053b92fff1',
            a_aid: '68b053b92fff1',
            chan: 'KZKBlu6j'
          };
          
          // Build complete affiliate URL with all required parameters
          const separator = productUrl.includes('?') ? '&' : '?';
          const affiliateParams = `utm_source=${utmSource}&utm_medium=${globalParams.utm_medium}&utm_campaign=${globalParams.utm_campaign}&a_aid=${globalParams.a_aid}&a_cid=${aCid}&chan=${globalParams.chan}`;
          affiliateUrl = `${productUrl}${separator}${affiliateParams}`;
          
          // Debug logging for first product
          if (productsProcessed === 1) {
            console.log('Debug - Shop affiliate params:', JSON.stringify(shopAffiliateParams, null, 2));
            console.log('Debug - Generated affiliate URL:', affiliateUrl);
          }
        }

        if (!title || !imageUrl || price <= 0) {
          errors.push(`Invalid product data: missing title, image, or price`);
          continue;
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
          
          // Create or update affiliate link for existing product if we have an affiliate URL  
          if (affiliateUrl) {
            const { data: existingAffiliateLink } = await supabaseClient
              .from('affiliate_links')
              .select('id')
              .eq('product_id', existingProduct.id)
              .single();
              
            if (existingAffiliateLink) {
              // Update existing affiliate link
              await supabaseClient
                .from('affiliate_links')
                .update({
                  affiliate_url: affiliateUrl
                })
                .eq('product_id', existingProduct.id);
            } else {
              // Create new affiliate link
              await supabaseClient
                .from('affiliate_links')
                .insert({
                  product_id: existingProduct.id,
                  affiliate_url: affiliateUrl
                });
            }
          }
          productsUpdated++;
        } else {
          // Create new product
          const { data: newProduct } = await supabaseClient
            .from('products')
            .insert(productData)
            .select('id')
            .single();

          if (newProduct && affiliateUrl) {
            // Create affiliate link with generated URL
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
  // Handle CDATA sections and clean the tag content
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  if (!match) return null;
  
  let value = match[1].trim();
  
  // Remove CDATA wrapper if present
  if (value.startsWith('<![CDATA[') && value.endsWith(']]>')) {
    value = value.slice(9, -3);
  }
  
  // Decode HTML entities
  value = value.replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"')
               .replace(/&#39;/g, "'");
  
  return value.trim() || null;
}