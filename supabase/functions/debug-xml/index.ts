import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    
    // Create auto-category mapping based on actual XML categories
    const autoCategoryMapping: Record<string, string> = {};
    
    // Extract category values from first few products to get actual XML categories
    const categoryPatterns = new Map<string, string[]>();
    
    // Set up category patterns based on market
    if (marketCode === 'sk') {
      categoryPatterns.set('knihy', ['knihy', 'kniha', 'book', 'books', 'literature', 'literatúra']);
      categoryPatterns.set('beletria', ['beletria', 'román', 'poézia', 'dráma', 'novela', 'fiction']);
      categoryPatterns.set('historia', ['história', 'dejiny', 'biografia', 'historické', 'pamäti', 'history']);
      categoryPatterns.set('nabozenstvo', ['kresťanské', 'náboženské', 'spirituálne', 'biblia', 'teológia', 'religion']);
      categoryPatterns.set('vzdelavanie', ['učebnica', 'slovník', 'jazyk', 'kurzovník', 'gramatika', 'education']);
      categoryPatterns.set('detske-knihy', ['detské', 'rozprávka', 'mládež', 'omaľovánky', 'básne', 'children']);
      categoryPatterns.set('odborna-literatura', ['ekonómia', 'právo', 'medicína', 'technika', 'informatika', 'veda', 'professional']);
    } else {
      // Default English patterns
      categoryPatterns.set('books', ['books', 'book', 'literatura', 'literature']);
      categoryPatterns.set('fiction', ['fiction', 'novel', 'poetry', 'drama', 'beletria']);
      categoryPatterns.set('history', ['history', 'biography', 'historical', 'memoir', 'historia']);
      categoryPatterns.set('religion', ['religion', 'christian', 'spiritual', 'bible', 'theology']);
      categoryPatterns.set('education', ['education', 'textbook', 'dictionary', 'language', 'grammar']);
      categoryPatterns.set('children', ['children', 'kids', 'fairy tale', 'coloring', 'young adult']);
      categoryPatterns.set('professional', ['professional', 'economics', 'law', 'medicine', 'technology', 'science']);
    }
    
    // Extract Google Shopping category IDs or category names from XML
    const categoryField = suggestedMapping.category || 'category';
    const googleCategoryRegex = new RegExp(`<${categoryField}[^>]*>([^<]+)</${categoryField}>`, 'gi');
    const detectedCategories = new Set<string>();
    
    let match;
    while ((match = googleCategoryRegex.exec(xmlText)) !== null && detectedCategories.size < 50) {
      const categoryValue = match[1].trim();
      if (categoryValue && categoryValue !== '784') { // Skip generic Google category ID
        detectedCategories.add(categoryValue.toLowerCase());
      }
    }
    
    // Map detected XML categories to our database categories
    categoryPatterns.forEach((keywords, dbCategory) => {
      detectedCategories.forEach(xmlCategory => {
        if (keywords.some(keyword => 
          xmlCategory.includes(keyword.toLowerCase()) || 
          keyword.toLowerCase().includes(xmlCategory)
        )) {
          autoCategoryMapping[xmlCategory] = dbCategory;
        }
      });
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