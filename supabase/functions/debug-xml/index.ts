import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client for category lookups
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to extract field names from XML element
function extractFieldsFromElement(element: string): string[] {
  const fieldMatches = element.match(/<([^\/\s>!?]+)[^>]*>/g) || [];
  const fields = fieldMatches
    .map(match => {
      const fieldMatch = match.match(/<([^\/\s>!?]+)/);
      return fieldMatch ? fieldMatch[1] : null;
    })
    .filter(field => field && !field.startsWith('!') && !field.startsWith('?'))
    .filter(field => field !== 'item' && field !== 'product' && field !== 'offer' && field !== 'SHOPITEM');
  
  return [...new Set(fields)]; // Remove duplicates
}

// Helper function to detect namespaces
function detectNamespaces(xmlText: string): Record<string, string> {
  const namespaceMatches = xmlText.match(/xmlns:([^=]+)="([^"]+)"/g) || [];
  const namespaces: Record<string, string> = {};
  
  namespaceMatches.forEach(match => {
    const parts = match.match(/xmlns:([^=]+)="([^"]+)"/);
    if (parts) {
      namespaces[parts[1]] = parts[2];
    }
  });
  
  return namespaces;
}

// Helper function to suggest field mappings
function suggestFieldMappings(fields: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  // Common field mappings based on patterns
  const patterns = {
    title: ['title', 'name', 'productname', 'product_name', 'item_title', 'g:title'],
    description: ['description', 'desc', 'summary', 'g:description', 'product_description'],
    price: ['price', 'cost', 'amount', 'g:price', 'price_vat', 'selling_price'],
    original_price: ['original_price', 'list_price', 'msrp', 'retail_price', 'price_orig'],
    image_url: ['image', 'img', 'picture', 'photo', 'g:image_link', 'imgurl', 'image_url'],
    external_id: ['id', 'item_id', 'product_id', 'sku', 'g:id', 'external_id'],
    category: ['category', 'cat', 'categorytext', 'g:google_product_category', 'product_category'],
    availability: ['availability', 'stock', 'in_stock', 'g:availability', 'delivery_date'],
    author: ['author', 'creator', 'writer', 'manufacturer'],
    publisher: ['publisher', 'brand', 'g:brand', 'manufacturer'],
    isbn: ['isbn', 'ean', 'gtin', 'g:gtin', 'barcode']
  };
  
  fields.forEach(field => {
    const fieldLower = field.toLowerCase().replace(/^g:/, '');
    
    for (const [targetField, variants] of Object.entries(patterns)) {
      if (variants.some(variant => fieldLower.includes(variant.toLowerCase()) || variant.toLowerCase().includes(fieldLower))) {
        if (!mapping[targetField]) {
          mapping[targetField] = field;
        }
      }
    }
  });
  
  return mapping;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let feedUrl = 'https://www.4home.hu/export/feed-arukereso.xml'; // Default fallback
    let marketCode = 'us'; // Default market
    
    // Try to get URL from request body or query parameters
    if (req.method === 'POST') {
      const body = await req.json();
      if (body.feedUrl || body.url) {
        feedUrl = body.feedUrl || body.url;
      }
      if (body.marketCode) {
        marketCode = body.marketCode.toLowerCase();
      }
    } else if (req.method === 'GET') {
      const url = new URL(req.url);
      const urlParam = url.searchParams.get('url') || url.searchParams.get('feedUrl');
      if (urlParam) {
        feedUrl = urlParam;
      }
      const marketParam = url.searchParams.get('marketCode');
      if (marketParam) {
        marketCode = marketParam.toLowerCase();
      }
    }

    console.log(`Analyzing XML feed: ${feedUrl} for market: ${marketCode}`);
    
    // Fetch the XML feed
    const response = await fetch(feedUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch XML feed: ${response.status} ${response.statusText}`);
    }
    
    const xmlText = await response.text();
    
    // Detect namespaces
    const namespaces = detectNamespaces(xmlText);
    
    // Find root element
    const rootMatch = xmlText.match(/<([^\/\s>]+)[^>]*>/);
    const rootElement = rootMatch ? rootMatch[1] : 'unknown';
    
    // Look for different types of product elements
    const productElements = [
      'item', 'product', 'offer', 'SHOPITEM', 'entry', 'listing'
    ];
    
    let detectedProductElement = null;
    let firstProductXml = '';
    let secondProductXml = '';
    let productCount = 0;
    
    // Try to find product elements
    for (const element of productElements) {
      const regex = new RegExp(`<${element}[^>]*>[\\s\\S]*?<\\/${element}>`, 'gi');
      const matches = xmlText.match(regex);
      
      if (matches && matches.length > 0) {
        detectedProductElement = element;
        firstProductXml = matches[0];
        secondProductXml = matches[1] || '';
        productCount = matches.length;
        break;
      }
    }
    
    // Extract all unique fields from first product
    let allFields: string[] = [];
    if (firstProductXml) {
      allFields = extractFieldsFromElement(firstProductXml);
    }
    
    // Suggest field mappings
    const suggestedMapping = suggestFieldMappings(allFields);
    
    // Get sample of XML for analysis
    const sampleXml = xmlText.substring(0, 3000);
    
    // Load actual database categories for mapping
    const { data: dbCategories, error: categoryError } = await supabase
      .from('categories')
      .select('id, name, slug')
      .ilike('market_code', marketCode)
      .eq('is_active', true);

    if (categoryError) {
      console.warn('Error loading database categories:', categoryError);
    }

    // Create Google Shopping category ID mapping
    const googleShoppingCategories = {
      '784': ['knihy', 'books', 'literature', 'book'],
      '1025': ['beletria', 'fiction', 'novel'],
      '1420': ['detské knihy', 'children books', 'kids'],
      '499886': ['učebnice', 'textbooks', 'education'],
      '783': ['časopisy', 'magazines', 'periodicals']
    };

    // Extract category values from XML feed
    const categoryField = suggestedMapping.category || 'category';
    const googleCategoryRegex = new RegExp(`<${categoryField}[^>]*>([^<]+)</${categoryField}>`, 'gi');
    const detectedCategories = new Set<string>();
    
    let match;
    while ((match = googleCategoryRegex.exec(xmlText)) !== null && detectedCategories.size < 50) {
      const categoryValue = match[1].trim();
      if (categoryValue) {
        detectedCategories.add(categoryValue);
      }
    }

    // Create mapping from XML categories to database category IDs
    const autoCategoryMapping: Record<string, string> = {};
    
    detectedCategories.forEach(xmlCategoryValue => {
      let mappedCategory = null;

      // First, check if it's a Google Shopping category ID
      if (googleShoppingCategories[xmlCategoryValue]) {
        const keywords = googleShoppingCategories[xmlCategoryValue];
        mappedCategory = dbCategories?.find(cat => 
          keywords.some(keyword => 
            cat.name.toLowerCase().includes(keyword) || 
            cat.slug.includes(keyword) ||
            keyword.includes(cat.slug)
          )
        );
      }

      // If no Google Shopping match, try fuzzy matching with category names
      if (!mappedCategory && dbCategories) {
        const xmlCategoryLower = xmlCategoryValue.toLowerCase();
        
        // Direct name/slug matching
        mappedCategory = dbCategories.find(cat => 
          cat.name.toLowerCase() === xmlCategoryLower ||
          cat.slug === xmlCategoryLower ||
          cat.name.toLowerCase().includes(xmlCategoryLower) ||
          xmlCategoryLower.includes(cat.name.toLowerCase())
        );

        // Pattern-based matching for Slovak market
        if (!mappedCategory && marketCode === 'sk') {
          const patterns = {
            'knihy': ['knihy', 'kniha', 'books', 'book', 'literature', 'literatúra'],
            'beletria': ['beletria', 'román', 'fiction', 'novel', 'poézia'],
            'detske-knihy': ['detské', 'children', 'kids', 'rozprávka', 'mladez'],
            'historia': ['história', 'history', 'dejiny', 'biografia'],
            'nabozenstvo': ['náboženské', 'religion', 'kresťanské', 'biblia'],
            'odborna-literatura': ['odborná', 'professional', 'technika', 'veda', 'medicína']
          };

          for (const [slug, keywords] of Object.entries(patterns)) {
            if (keywords.some(keyword => xmlCategoryLower.includes(keyword.toLowerCase()))) {
              mappedCategory = dbCategories.find(cat => cat.slug === slug);
              break;
            }
          }
        }
      }

      if (mappedCategory) {
        autoCategoryMapping[xmlCategoryValue] = mappedCategory.id;
      }
    });
    
    // Create comprehensive mapping config suggestion
    const mappingConfigSuggestion = {
      fields: suggestedMapping,
      product_element: detectedProductElement || 'item',
      category_mapping: autoCategoryMapping
    };

    // Analysis summary matching UniversalImport FeedStructure interface
    const analysis = {
      isValid: productCount > 0 && suggestedMapping.title && suggestedMapping.price,
      warnings: [] as string[],
      detectedFields: allFields,
      suggestedMapping: suggestedMapping,
      sampleXml: firstProductXml.substring(0, 1000),
      categoryMapping: autoCategoryMapping,
      detectedCategories: Array.from(detectedCategories),
      feedOverview: {
        rootElement,
        namespaces,
        productElement: detectedProductElement || 'unknown',
        productElements: [detectedProductElement].filter(Boolean),
        totalProducts: productCount,
        sampleProduct: firstProductXml.substring(0, 500)
      },
      validation: {
        hasTitle: !!suggestedMapping.title,
        hasPrice: !!suggestedMapping.price,
        hasImage: !!suggestedMapping.image_url,
        hasCategories: Object.keys(autoCategoryMapping).length > 0,
        hasRequiredFields: !!(suggestedMapping.title && suggestedMapping.price),
        warnings: [] as string[]
      },
      // Additional compatibility fields
      sampleProductXml: firstProductXml.substring(0, 2000),
      feedUrl,
      xmlLength: xmlText.length,
      mappingConfigSuggestion,
      firstProductXml: firstProductXml.substring(0, 2000),
      secondProductXml: secondProductXml.substring(0, 2000)
    };
    
    // Add validation warnings
    const warnings: string[] = [];
    if (productCount === 0) {
      warnings.push('No product elements detected');
    }
    if (!suggestedMapping.title) {
      warnings.push('No title field detected');
    }
    if (!suggestedMapping.price) {
      warnings.push('No price field detected');
    }
    if (!suggestedMapping.image_url) {
      warnings.push('No image field detected');
    }
    
    // Update analysis with warnings
    analysis.warnings = warnings;
    analysis.validation.warnings = warnings;
    
    return new Response(JSON.stringify(analysis, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error analyzing XML feed:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to analyze XML feed structure'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});