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
          shops:shop_id(*),
          affiliate_links(*)
        `)
        .eq('id', productId)
        .single();

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
        shop: product.shops?.name,
        tracking_code: trackingCode
      });

      // Get the affiliate URL
      const affiliateLink = product.affiliate_links?.[0];
      let redirectUrl = product.description.match(/<product_url>(.*?)<\/product_url>/)?.[1];
      
      if (!redirectUrl) {
        // Fallback: construct URL based on shop
        redirectUrl = `https://www.${product.shops?.name?.toLowerCase()}.hu/`;
      }

      // Create tracking URL with your affiliate parameters
      const trackingUrl = new URL('https://your-tracking-domain.com/redirect');
      trackingUrl.searchParams.set('url', encodeURIComponent(redirectUrl));
      trackingUrl.searchParams.set('source', 'pricecomparise');
      trackingUrl.searchParams.set('product', productId);
      trackingUrl.searchParams.set('tracking', trackingCode || '');
      trackingUrl.searchParams.set('market', product.market_code);

      return new Response(
        JSON.stringify({ 
          success: true, 
          redirectUrl: trackingUrl.toString(),
          originalUrl: redirectUrl,
          trackingCode 
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