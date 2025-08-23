import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Fetch just a small sample of the XML to analyze structure
    const response = await fetch('https://www.4home.hu/export/feed-arukereso.xml');
    const xmlText = await response.text();
    
    // Get first 5000 characters to analyze
    const sample = xmlText.substring(0, 5000);
    
    // Find first product
    const productMatch = sample.match(/<item[^>]*>[\s\S]*?<\/item>/i) || 
                        sample.match(/<product[^>]*>[\s\S]*?<\/product>/i) ||
                        sample.match(/<offer[^>]*>[\s\S]*?<\/offer>/i);
    
    let productXml = '';
    if (productMatch) {
      productXml = productMatch[0];
    }
    
    // Find root element and its immediate children
    const rootMatch = xmlText.match(/<([^\/\s>]+)[^>]*>/);
    const rootElement = rootMatch ? rootMatch[1] : 'unknown';
    
    // Look for product containers
    const containers = xmlText.match(/<(items?|products?|offers?)[^>]*>/gi) || [];
    
    return new Response(JSON.stringify({
      rootElement,
      containers: containers.slice(0, 5),
      sampleXml: sample,
      firstProductXml: productXml,
      xmlLength: xmlText.length
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});