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
          shop:shops(*),
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
        // Fallback: construct URL based on shop
        redirectUrl = `https://www.${product.shop?.name?.toLowerCase()}.hu/`;
      }

      // For Dognet network, use the direct affiliate URL without additional tracking wrapper
      // The affiliate URL from Dognet already contains the proper tracking parameters
      console.log('Using Dognet affiliate URL:', redirectUrl);

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