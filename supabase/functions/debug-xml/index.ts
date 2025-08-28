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
    let feedUrl = 'https://yaby.eu/pythonProject/projekt/antik/feedy_tvorba_antik/trhknih/dognetsk.xml'; // Updated default
    let marketCode = 'SK'; // Default to SK market
    
    // Try to get URL from request body or query parameters
    if (req.method === 'POST') {
      const body = await req.json();
      if (body.feedUrl || body.url) {
        feedUrl = body.feedUrl || body.url;
      }
      if (body.marketCode) {
        marketCode = body.marketCode.toUpperCase();
      }
    } else if (req.method === 'GET') {
      const url = new URL(req.url);
      const urlParam = url.searchParams.get('url') || url.searchParams.get('feedUrl');
      if (urlParam) {
        feedUrl = urlParam;
      }
      const marketParam = url.searchParams.get('marketCode');
      if (marketParam) {
        marketCode = marketParam.toUpperCase();
      }
    }

    console.log(`Analyzing XML feed: ${feedUrl} for market: ${marketCode}`);
    console.log(`Debug: Loading categories for market code: ${marketCode}`);
    
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
    
    // Load actual database categories for mapping - fix market code matching
    const { data: dbCategories, error: categoryError } = await supabase
      .from('categories')
      .select('id, name, slug')
      .eq('market_code', marketCode.toUpperCase())
      .eq('is_active', true);

    if (categoryError) {
      console.warn('Error loading database categories:', categoryError);
    } else {
      console.log(`Debug: Loaded ${dbCategories?.length || 0} categories for market ${marketCode}:`, 
        dbCategories?.map(c => `${c.name} (${c.slug})`).join(', '));
    }

    // Create Google Shopping category ID mapping - enhanced for Slovak market
    const googleShoppingCategories = {
      '784': ['knihy', 'books', 'literature', 'book', 'kniha'],
      '1025': ['beletria', 'fiction', 'novel', 'román'],
      '1420': ['detské knihy', 'children books', 'kids', 'detske-knihy'],
      '499886': ['učebnice', 'textbooks', 'education', 'odborna-literatura'],
      '783': ['časopisy', 'magazines', 'periodicals', 'časopis']
    };

    // Extract category values from XML feed - enhanced for namespaced tags
    const categoryField = suggestedMapping.category || 'category';
    const detectedCategories = new Set<string>();
    
    console.log(`Debug: Looking for category field "${categoryField}" in XML`);
    
    // Try multiple regex patterns for better category extraction
    const regexPatterns = [
      // Standard pattern
      new RegExp(`<${categoryField}[^>]*>([^<]+)<\\/${categoryField}>`, 'gi'),
      // Namespaced pattern (e.g., g:google_product_category)
      new RegExp(`<[^:]*:${categoryField.replace(/^[^:]*:/, '')}[^>]*>([^<]+)<\\/[^:]*:${categoryField.replace(/^[^:]*:/, '')}>`, 'gi'),
      // Google Shopping specific pattern
      new RegExp(`<g:google_product_category[^>]*>([^<]+)<\\/g:google_product_category>`, 'gi'),
      // CDATA pattern
      new RegExp(`<${categoryField}[^>]*><!\\[CDATA\\[([^\\]]+)\\]\\]><\\/${categoryField}>`, 'gi')
    ];
    
    // Try each regex pattern
    for (const regex of regexPatterns) {
      let match;
      const patternName = regex.toString().substring(0, 50) + '...';
      console.log(`Debug: Trying regex pattern: ${patternName}`);
      
      while ((match = regex.exec(xmlText)) !== null && detectedCategories.size < 50) {
        const categoryValue = match[1].trim();
        if (categoryValue) {
          console.log(`Debug: Found category value "${categoryValue}" using pattern ${patternName}`);
          detectedCategories.add(categoryValue);
        }
      }
    }
    
    console.log(`Debug: Total detected categories: ${detectedCategories.size}`, Array.from(detectedCategories));

    // Create mapping from XML categories to database category IDs
    const autoCategoryMapping: Record<string, string> = {};
    
    detectedCategories.forEach(xmlCategoryValue => {
      let mappedCategory = null;
      console.log(`Debug: Processing XML category "${xmlCategoryValue}"`);

      // First, check if it's a Google Shopping category ID - enhanced matching
      if (googleShoppingCategories[xmlCategoryValue]) {
        console.log(`Debug: Found Google Shopping category mapping for "${xmlCategoryValue}"`);
        const keywords = googleShoppingCategories[xmlCategoryValue];
        mappedCategory = dbCategories?.find(cat => 
          keywords.some(keyword => 
            cat.name.toLowerCase().includes(keyword.toLowerCase()) || 
            cat.slug.toLowerCase().includes(keyword.toLowerCase()) ||
            keyword.toLowerCase().includes(cat.slug.toLowerCase()) ||
            cat.name.toLowerCase() === keyword.toLowerCase() ||
            cat.slug.toLowerCase() === keyword.toLowerCase()
          )
        );
        
        // If no exact match, for category 784 (books), specifically look for "Knihy" category
        if (!mappedCategory && xmlCategoryValue === '784') {
          console.log(`Debug: Looking specifically for "Knihy" category for Google category 784`);
          mappedCategory = dbCategories?.find(cat => 
            cat.name.toLowerCase() === 'knihy' || cat.slug.toLowerCase() === 'knihy'
          );
        }
        
        if (mappedCategory) {
          console.log(`Debug: Mapped Google category "${xmlCategoryValue}" to database category "${mappedCategory.name}" (${mappedCategory.id})`);
        }
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
        if (!mappedCategory && marketCode === 'SK') {
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
        console.log(`Debug: Final mapping: "${xmlCategoryValue}" → "${mappedCategory.name}" (${mappedCategory.id})`);
        autoCategoryMapping[xmlCategoryValue] = mappedCategory.id;
      } else {
        console.log(`Debug: No mapping found for XML category "${xmlCategoryValue}"`);
      }
    });
    
    console.log(`Debug: Final category mappings:`, JSON.stringify(autoCategoryMapping, null, 2));
    
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