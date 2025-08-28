import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TrackClickRequest {
  productId: string;
  trackingCode?: string;
  referrer?: string;
  userAgent?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const { productId, trackingCode, referrer, userAgent } = await req.json() as TrackClickRequest;

      console.log('Tracking click:', { productId, trackingCode, referrer });

      // Get the product and affiliate link
      const { data: product, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          shop:shops(*, affiliate_params),
          affiliate_links!inner(*)
        `)
        .eq('id', productId)
        .single();

      console.log('Product data:', product);
      console.log('Affiliate links raw:', product?.affiliate_links);

      if (productError || !product) {
        console.error('Product not found:', productError);
        return new Response(
          JSON.stringify({ error: 'Product not found' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404 
          }
        );
      }

      // Log the click (you can extend this to store in a clicks table)
      console.log('Click tracked for product:', {
        product: product.title,
        shop: product.shop?.name,
        tracking_code: trackingCode
      });

      // Get the affiliate URL - use the actual affiliate link if available
      // Handle both array and single object cases for affiliate_links
      const affiliateLink = Array.isArray(product.affiliate_links) 
        ? product.affiliate_links?.[0] 
        : product.affiliate_links;
      let redirectUrl = affiliateLink?.affiliate_url;
      
      console.log('Affiliate link found:', affiliateLink);
      console.log('Redirect URL:', redirectUrl);
      
      if (!redirectUrl) {
        // Fallback: construct URL based on shop website with affiliate parameters
        if (product.shop?.website_url) {
          const shopAffiliateParams = product.shop.affiliate_params || {};
          const utmSource = shopAffiliateParams.utm_source || 'dognet';
          const aCid = shopAffiliateParams.a_cid || '908fbcd7';
          
          const globalParams = {
            utm_medium: 'affiliate',
            utm_campaign: '68b053b92fff1',
            a_aid: '68b053b92fff1',
            chan: 'KZKBlu6j'
          };
          
          const separator = product.shop.website_url.includes('?') ? '&' : '?';
          const affiliateParams = `utm_source=${utmSource}&utm_medium=${globalParams.utm_medium}&utm_campaign=${globalParams.utm_campaign}&a_aid=${globalParams.a_aid}&a_cid=${aCid}&chan=${globalParams.chan}`;
          redirectUrl = `${product.shop.website_url}${separator}${affiliateParams}`;
        } else {
          redirectUrl = `https://www.${product.shop?.name?.toLowerCase()}.com/`;
        }
      }

      console.log('Using affiliate URL from database:', redirectUrl);

      return new Response(
        JSON.stringify({ 
          success: true, 
          redirectUrl: redirectUrl,
          trackingCode: affiliateLink?.tracking_code || trackingCode
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405 
      }
    );

  } catch (error) {
    console.error('Error in affiliate tracking:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});