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

    const { market_code, limit = 100 } = await req.json();

    console.log(`Backfilling affiliate links for market: ${market_code}`);

    // Get products without affiliate links
    const { data: products, error: productsError } = await supabaseClient
      .from('products')
      .select(`
        id,
        title,
        external_id,
        shop:shops(id, name, affiliate_params, website_url)
      `)
      .eq('market_code', market_code)
      .is('affiliate_links.id', null)
      .limit(limit);

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    console.log(`Found ${products?.length || 0} products without affiliate links`);

    let linksCreated = 0;
    const errors: string[] = [];

    for (const product of products || []) {
      try {
        const shop = product.shop;
        if (!shop || !shop.affiliate_params || !shop.website_url) {
          continue;
        }

        const shopAffiliateParams = shop.affiliate_params || {};
        const utmSource = shopAffiliateParams.utm_source || 'dognet';
        const aCid = shopAffiliateParams.a_cid || '908fbcd7';
        
        // Global affiliate parameters
        const globalParams = {
          utm_medium: 'affiliate',
          utm_campaign: '68b053b92fff1',
          a_aid: '68b053b92fff1',
          chan: 'KZKBlu6j'
        };

        // Construct product URL - this might need to be adjusted based on shop URL structure
        let productUrl = shop.website_url;
        if (product.external_id) {
          // Remove trailing slash and add product ID
          productUrl = productUrl.replace(/\/$/, '') + '/' + product.external_id;
        }

        // Build complete affiliate URL
        const separator = productUrl.includes('?') ? '&' : '?';
        const affiliateParams = `utm_source=${utmSource}&utm_medium=${globalParams.utm_medium}&utm_campaign=${globalParams.utm_campaign}&a_aid=${globalParams.a_aid}&a_cid=${aCid}&chan=${globalParams.chan}`;
        const affiliateUrl = `${productUrl}${separator}${affiliateParams}`;

        // Create affiliate link
        const { error: insertError } = await supabaseClient
          .from('affiliate_links')
          .insert({
            product_id: product.id,
            affiliate_url: affiliateUrl
          });

        if (insertError) {
          errors.push(`Failed to create affiliate link for product ${product.title}: ${insertError.message}`);
        } else {
          linksCreated++;
        }

      } catch (error) {
        errors.push(`Error processing product ${product.title}: ${error.message}`);
      }
    }

    console.log(`Backfill completed: ${linksCreated} affiliate links created, ${errors.length} errors`);

    return new Response(JSON.stringify({
      success: true,
      linksCreated,
      productsProcessed: products?.length || 0,
      errors: errors.slice(0, 10) // Return first 10 errors
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in backfill-affiliate-links function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});