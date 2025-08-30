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

      // Get the product and affiliate link with proper joins
      const { data: product, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          shop:shops(*),
          affiliate_links(*)
        `)
        .eq('id', productId)
        .single();

      console.log('Product data:', product);

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

      // Get the first active affiliate link
      const affiliateLink = product.affiliate_links?.[0];
      let redirectUrl = affiliateLink?.affiliate_url;
      
      console.log('Affiliate link found:', affiliateLink);
      console.log('Initial redirect URL:', redirectUrl);

      // Ensure affiliate URL has proper tracking parameters
      if (redirectUrl && product.shop?.name === 'Restorio.sk') {
        // Check if URL already has tracking parameters
        if (!redirectUrl.includes('utm_source=dognet')) {
          const separator = redirectUrl.includes('?') ? '&' : '?';
          const trackingParams = 'utm_source=dognet&utm_medium=affiliate&utm_campaign=68b053b92fff1&a_aid=68b053b92fff1&a_cid=908fbcd7&chan=KZKBlu6j';
          redirectUrl = `${redirectUrl}${separator}${trackingParams}`;
        }
      } else if (!redirectUrl && product.shop?.website_url) {
        // Fallback: construct URL based on shop website with affiliate parameters
        const shopParams = product.shop.affiliate_params || {};
        const utmSource = shopParams.utm_source || 'dognet';
        const aCid = shopParams.a_cid || '908fbcd7';
        
        const separator = product.shop.website_url.includes('?') ? '&' : '?';
        const affiliateParams = `utm_source=${utmSource}&utm_medium=affiliate&utm_campaign=68b053b92fff1&a_aid=68b053b92fff1&a_cid=${aCid}&chan=KZKBlu6j`;
        redirectUrl = `${product.shop.website_url}${separator}${affiliateParams}`;
      } else if (!redirectUrl) {
        // Last resort fallback
        redirectUrl = `https://www.${product.shop?.name?.toLowerCase().replace(/\./g, '')}.sk/`;
      }

      console.log('Final redirect URL with tracking:', redirectUrl);

      // Log the click for analytics
      console.log('Click tracked for product:', {
        product: product.title,
        shop: product.shop?.name,
        final_url: redirectUrl
      });

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