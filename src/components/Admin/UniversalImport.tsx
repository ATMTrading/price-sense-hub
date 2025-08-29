import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMarket } from "@/hooks/useMarket";
import { Settings, Download, Target, Zap, Eye, Copy, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

interface Feed {
  id: string;
  name: string;
  url: string;
  market_code: string;
  mapping_config: any;
  affiliate_link_template: any;
  feed_structure?: any;
}

interface FeedStructure {
  isValid: boolean;
  warnings: string[];
  feedOverview: {
    rootElement: string;
    namespaces: Record<string, string>;
    productElements: string[];
    totalProducts: number;
  };
  detectedFields: string[];
  suggestedMapping: Record<string, string>;
  sampleProductXml: string;
}

export const UniversalImport = () => {
  const { market } = useMarket();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [selectedFeed, setSelectedFeed] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [productsPerCategory, setProductsPerCategory] = useState(20);
  const [maxProducts, setMaxProducts] = useState(1000);
  const [feedStructure, setFeedStructure] = useState<FeedStructure | null>(null);
  const [showStructure, setShowStructure] = useState(false);
  const [affiliateTemplate, setAffiliateTemplate] = useState("");
  const [customAffiliateTemplate, setCustomAffiliateTemplate] = useState("");
  const [categoryMapping, setCategoryMapping] = useState<Record<string, string>>({});
  const [refreshingFeed, setRefreshingFeed] = useState(false);
  const [bookCategories, setBookCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadCategories();
    loadFeeds();
  }, [market]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, parent_id')
        .ilike('market_code', market.code)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
      
      // Cache book categories for faster access
      const bookCats = (data || []).filter(cat => 
        cat.name.toLowerCase().includes('knihy') || 
        cat.name.toLowerCase().includes('book') ||
        cat.slug.includes('book')
      );
      setBookCategories(bookCats);
      
    } catch (error) {
      toast({
        title: "Error loading categories",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFeeds = async () => {
    try {
      const { data, error } = await supabase
        .from('xml_feeds')
        .select('id, name, url, market_code, mapping_config, affiliate_link_template')
        .eq('is_active', true)
        .ilike('market_code', market.code); // Use ilike for case-insensitive matching

      if (error) throw error;
      setFeeds(data || []);

      // Auto-select first feed if available
      if (data && data.length > 0) {
        setSelectedFeed(data[0].id);
        loadFeedStructure(data[0].id);
      }
    } catch (error) {
      console.error('Error loading feeds:', error);
      toast({
        title: "Error loading feeds",
        description: "Could not load XML feeds for this market",
        variant: "destructive"
      });
    }
  };

  const loadFeedStructure = async (feedId: string) => {
    const feed = feeds.find(f => f.id === feedId);
    if (!feed) return;

    try {
      // First check if we have stored category mappings
      const storedCategoryMapping = feed.mapping_config?.category_mapping || {};
      
      if (Object.keys(storedCategoryMapping).length > 0) {
        console.log('Using stored category mappings:', storedCategoryMapping);
        setCategoryMapping(storedCategoryMapping);
        autoSelectMappedCategories(storedCategoryMapping);
        
        // Set affiliate template from feed config
        const affiliateTemplate = feed.affiliate_link_template || {};
        setAffiliateTemplate(JSON.stringify(affiliateTemplate, null, 2));
        setCustomAffiliateTemplate(JSON.stringify(affiliateTemplate, null, 2));
        
        toast({
          title: "Feed configuration loaded",
          description: `Found ${Object.keys(storedCategoryMapping).length} stored category mappings`,
          duration: 3000
        });
        return;
      }

      // If no stored mappings, analyze the feed
      toast({
        title: "Analyzing feed structure...",
        description: "Please wait while we analyze the XML feed",
        duration: 2000
      });

      const { data, error } = await supabase.functions.invoke('debug-xml', {
        body: { 
          feedUrl: feed.url,
          marketCode: feed.market_code
        }
      });

      if (error) throw error;

      console.log('Feed structure analysis:', data);
      console.log('Received categoryMapping:', data.categoryMapping);
      setFeedStructure(data);
      
      // Use the feed's pre-configured affiliate template
      const affiliateTemplate = feed.affiliate_link_template || {};
      setAffiliateTemplate(JSON.stringify(affiliateTemplate, null, 2));
      setCustomAffiliateTemplate(JSON.stringify(affiliateTemplate, null, 2));
      
      // Use the detected category mappings from XML analysis
      const xmlCategoryMapping = data.categoryMapping || {};
      console.log('Processing xmlCategoryMapping:', xmlCategoryMapping);
      
      // The XML analysis now returns direct category ID mappings
      setCategoryMapping(xmlCategoryMapping);
      
      // Update feed with new mapping if we have suggestions
      if (Object.keys(xmlCategoryMapping).length > 0) {
        await updateFeedStructure(feedId, data, xmlCategoryMapping);
      }
      
      // Auto-select categories that have XML mappings
      autoSelectMappedCategories(xmlCategoryMapping);
      
      toast({
        title: "Feed analysis complete",
        description: `Found ${data.detectedFields?.length || 0} fields, ${data.feedOverview?.totalProducts || 0} products, and ${Object.keys(xmlCategoryMapping).length} category mappings`,
        duration: 3000
      });
    } catch (error) {
      console.error('Error loading feed structure:', error);
      toast({
        title: "Error analyzing feed structure",
        description: error instanceof Error ? error.message : "Could not analyze the XML feed structure",
        variant: "destructive"
      });
    }
  };

  const autoSelectMappedCategories = (mapping: Record<string, string>) => {
    // Find categories that have XML mappings and auto-select them
    const mappedCategoryIds = Object.values(mapping);
    const validMappedIds = mappedCategoryIds.filter(id => 
      categories.some(cat => cat.id === id)
    );
    setSelectedCategories(validMappedIds);
    
    if (validMappedIds.length > 0) {
      toast({
        title: "Auto-selected categories",
        description: `${validMappedIds.length} categories with XML mappings were automatically selected`,
        duration: 3000
      });
    }
  };

  const handleFeedChange = (feedId: string) => {
    setSelectedFeed(feedId);
    setSelectedCategories([]); // Reset selection when changing feeds
    loadFeedStructure(feedId);
  };

  const handleAutoSelectMapped = () => {
    autoSelectMappedCategories(categoryMapping);
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSelectAll = () => {
    const allSelected = categories.every(cat => selectedCategories.includes(cat.id));
    if (allSelected) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categories.map(cat => cat.id));
    }
  };

  const startTargetedImport = async () => {
    if (!selectedFeed) {
      toast({
        title: "Please select a feed",
        variant: "destructive"
      });
      return;
    }

    if (selectedCategories.length === 0) {
      toast({
        title: "Please select at least one category",
        variant: "destructive"
      });
      return;
    }

    setImporting(true);
    setImportProgress(0);

    try {
      // Optimize for book imports by using book-specific processing
      const isBookImport = bookCategories.some(cat => 
        selectedCategories.includes(cat.id)
      );
      
      const { error } = await supabase.functions.invoke('process-xml-feed', {
        body: {
          feed_id: selectedFeed,
          category_filter: selectedCategories,
          import_type: isBookImport ? 'book_import_optimized' : 'targeted_import',
          products_per_category: productsPerCategory,
          market_code: market.code,
          optimization_flags: isBookImport ? {
            enable_batch_processing: true,
            cache_categories: true,
            use_book_specific_logic: true,
            google_books_category_filter: "784"
          } : {}
        }
      });

      if (error) throw error;

      const categoryCount = Object.keys(categoryMapping).length;
      const totalProducts = categoryCount === 1 
        ? Math.min(productsPerCategory * selectedCategories.length, productsPerCategory)
        : productsPerCategory * selectedCategories.length;
      
      toast({
        title: isBookImport ? "Book Import Started" : "Targeted Import Started",
        description: categoryCount === 1 
          ? `Importing up to ${productsPerCategory} products to ${selectedCategories.length} selected ${selectedCategories.length === 1 ? 'category' : 'categories'}`
          : `Importing ${productsPerCategory} products per category for ${selectedCategories.length} categories`,
        duration: 5000
      });

      // Optimized progress simulation with smoother updates
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + Math.random() * 8 + 2; // More natural progress
        });
      }, 800);

      setTimeout(() => {
        setImportProgress(100);
        clearInterval(progressInterval);
        setImporting(false);
        toast({
          title: "Import completed!",
          description: isBookImport 
            ? "Books have been imported and categorized with enhanced performance" 
            : "Products have been imported and categorized",
          duration: 3000
        });
      }, 20000);

    } catch (error) {
      toast({
        title: "Error starting import",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
      setImporting(false);
    }
  };

  const startFullImport = async () => {
    if (!selectedFeed) {
      toast({
        title: "Please select a feed",
        variant: "destructive"
      });
      return;
    }

    setImporting(true);

    try {
      const { error } = await supabase.functions.invoke('process-xml-feed', {
        body: {
          feed_id: selectedFeed,
          import_type: 'full_catalog',
          max_products: maxProducts,
          market_code: market.code,
          // Use pre-configured affiliate template from feed
        }
      });

      if (error) throw error;

      toast({
        title: "Full catalog import started",
        description: `Processing up to ${maxProducts} products with automatic categorization`,
        duration: 5000
      });

    } catch (error) {
      toast({
        title: "Error starting full import",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
      setImporting(false);
    }
  };

  const generateAffiliateTemplate = (templateConfig: any) => {
    if (!templateConfig) return { base_url: "", url_encode: true, append_product_url: true };
    
    // If it's already in proper format, return as is
    if (templateConfig.base_url) {
      return {
        base_url: templateConfig.base_url,
        url_encode: templateConfig.url_encode !== false,
        append_product_url: templateConfig.append_product_url !== false
      };
    }
    
    // Convert from simple URL to proper template format
    return {
      base_url: templateConfig.toString(),
      url_encode: true,
      append_product_url: true
    };
  };
  
  const updateFeedStructure = async (feedId: string, structureData: any, categoryMapping: Record<string, string>) => {
    try {
      await supabase.functions.invoke('admin-operations', {
        body: {
          action: 'update_feed_structure',
          data: {
            feed_id: feedId,
            structure_analysis: structureData,
            category_mapping: categoryMapping
          }
        }
      });
    } catch (error) {
      console.error('Error updating feed structure:', error);
    }
  };

  // Refresh feed analysis function
  const refreshFeedAnalysis = async () => {
    if (!selectedFeed) return;
    
    setRefreshingFeed(true);
    
    try {
      // Clear current feed structure and mappings
      setFeedStructure(null);
      setCategoryMapping({});
      setSelectedCategories([]);
      setAffiliateTemplate("");
      setCustomAffiliateTemplate("");
      
      toast({
        title: "Refreshing feed analysis...",
        description: "Re-analyzing feed structure and category mappings",
        duration: 2000
      });
      
      // Force fresh analysis
      await loadFeedStructure(selectedFeed);
      
      toast({
        title: "Feed refreshed",
        description: "Feed analysis has been updated with latest data",
      });
      
    } catch (error) {
      toast({
        title: "Error refreshing feed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setRefreshingFeed(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      duration: 2000
    });
  };

  if (loading) {
    return <div>Loading import configuration...</div>;
  }

  const selectedFeedData = feeds.find(f => f.id === selectedFeed);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Download className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Universal XML Import</h2>
        </div>
        <Badge variant="outline">{market.flag} {market.code}</Badge>
      </div>

      {/* Feed Selection and Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Import Configuration</CardTitle>
          <CardDescription>Configure feed source and import settings for {market.code} market</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="feed-select">Feed Source</Label>
              <div className="flex gap-2">
                <Select value={selectedFeed} onValueChange={handleFeedChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a feed" />
                  </SelectTrigger>
                  <SelectContent>
                    {feeds.map(feed => (
                      <SelectItem key={feed.id} value={feed.id}>
                        {feed.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={refreshFeedAnalysis}
                  disabled={!selectedFeed || refreshingFeed}
                  title="Refresh feed analysis"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshingFeed ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="products-per-category">Products per Category</Label>
              <Select value={productsPerCategory.toString()} onValueChange={value => setProductsPerCategory(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 products</SelectItem>
                  <SelectItem value="20">20 products</SelectItem>
                  <SelectItem value="50">50 products</SelectItem>
                  <SelectItem value="100">100 products</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pre-configured Feed Information */}
          {selectedFeedData && (
            <div>
              <Label>Pre-configured Affiliate Settings</Label>
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="text-sm">
                  <strong>Feed:</strong> {selectedFeedData.name}
                </div>
                {selectedFeedData.affiliate_link_template?.base_url && (
                  <div className="text-sm">
                    <strong>Affiliate Base URL:</strong> {selectedFeedData.affiliate_link_template.base_url}
                  </div>
                )}
                {selectedFeedData.mapping_config && Object.keys(selectedFeedData.mapping_config).length > 0 && (
                  <div className="text-sm">
                    <strong>Field Mappings:</strong> {Object.keys(selectedFeedData.mapping_config).length} fields configured
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  This feed has been pre-configured with automatic analysis. All settings are ready for import.
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feed Structure Overview - Always Visible */}
      {feedStructure && selectedFeedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Feed Structure: {selectedFeedData.name}</span>
              </div>
              <Dialog open={showStructure} onOpenChange={setShowStructure}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    Full Analysis
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Complete Feed Analysis: {selectedFeedData.name}</DialogTitle>
                    <DialogDescription>
                      Detailed XML structure, field mappings, and configuration
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Feed Overview */}
                    <div>
                      <h4 className="font-semibold mb-2">Feed Overview</h4>
                      <div className="bg-muted p-3 rounded">
                        <p><strong>Root Element:</strong> {feedStructure.feedOverview.rootElement}</p>
                        <p><strong>Product Elements:</strong> {feedStructure.feedOverview.productElements.join(", ")}</p>
                        <p><strong>Total Products:</strong> {feedStructure.feedOverview.totalProducts}</p>
                        {Object.keys(feedStructure.feedOverview.namespaces).length > 0 && (
                          <p><strong>Namespaces:</strong> {Object.entries(feedStructure.feedOverview.namespaces).map(([prefix, uri]) => `${prefix}: ${uri}`).join(", ")}</p>
                        )}
                      </div>
                    </div>

                    {/* Detected Fields */}
                    <div>
                      <h4 className="font-semibold mb-2">All Detected Fields ({feedStructure.detectedFields.length})</h4>
                      <div className="flex flex-wrap gap-1">
                        {feedStructure.detectedFields.map(field => (
                          <Badge key={field} variant="outline" className="text-xs">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Category Mapping */}
                    {Object.keys(categoryMapping).length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Category Mappings</h4>
                        <div className="space-y-2">
                          {Object.entries(categoryMapping).map(([xmlCategory, dbCategoryId]) => {
                            const dbCategory = categories.find(c => c.id === dbCategoryId);
                            return (
                              <div key={xmlCategory} className="flex justify-between items-center p-2 bg-muted rounded">
                                <span className="font-mono text-sm">"{xmlCategory}"</span>
                                <span>→</span>
                                <span className="font-medium">{dbCategory?.name || 'Unknown Category'}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Sample Product XML */}
                    {feedStructure.sampleProductXml && (
                      <div>
                        <h4 className="font-semibold mb-2">Sample Product XML</h4>
                        <Textarea
                          value={feedStructure.sampleProductXml}
                          readOnly
                          className="font-mono text-sm"
                          rows={10}
                        />
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Key Structure Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  {feedStructure.isValid ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="font-medium">Status</span>
                </div>
                <Badge variant={feedStructure.isValid ? "default" : "destructive"} className={feedStructure.isValid ? "bg-green-100 text-green-800" : ""}>
                  {feedStructure.isValid ? "Valid" : "Invalid"}
                </Badge>
              </div>
              <div className="text-center">
                <div className="font-medium mb-1">Products</div>
                <Badge variant="outline">{feedStructure.feedOverview?.totalProducts || 0}</Badge>
              </div>
              <div className="text-center">
                <div className="font-medium mb-1">Fields</div>
                <Badge variant="outline">{feedStructure.detectedFields.length}</Badge>
              </div>
              <div className="text-center">
                <div className="font-medium mb-1">Mappings</div>
                <Badge variant="outline">{Object.keys(categoryMapping).length}</Badge>
              </div>
            </div>

            {/* Key Fields Preview */}
            <div>
              <h5 className="font-medium mb-2">Key Fields Detected:</h5>
              <div className="flex flex-wrap gap-1">
                {feedStructure.detectedFields.slice(0, 8).map(field => (
                  <Badge key={field} variant="secondary" className="text-xs">
                    {field}
                  </Badge>
                ))}
                {feedStructure.detectedFields.length > 8 && (
                  <Badge variant="outline" className="text-xs">
                    +{feedStructure.detectedFields.length - 8} more
                  </Badge>
                )}
              </div>
            </div>

            {/* Warnings */}
            {feedStructure.warnings.length > 0 && (
              <div className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                <p className="text-sm font-medium text-yellow-800 mb-1">⚠️ Warnings ({feedStructure.warnings.length}):</p>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {feedStructure.warnings.slice(0, 3).map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                  {feedStructure.warnings.length > 3 && (
                    <li className="italic">... and {feedStructure.warnings.length - 3} more (see full analysis)</li>
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Category Selection with Smart Mapping */}
      <Card>
        <CardHeader>
          <CardTitle>Category Selection & Mapping</CardTitle>
          <CardDescription>Select categories to import products into with automatic XML mapping</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Available Categories ({categories.length})</Label>
            <div className="flex space-x-2">
              {Object.keys(categoryMapping).length > 0 && (
                <Button size="sm" variant="default" onClick={handleAutoSelectMapped}>
                  <Target className="w-4 h-4 mr-1" />
                  Auto-select Mapped ({Object.keys(categoryMapping).length})
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleSelectAll}>
                {categories.every(cat => selectedCategories.includes(cat.id)) ? 'Deselect All' : 'Select All'}
              </Button>
              <Badge variant="secondary">
                {selectedCategories.length} selected
              </Badge>
            </div>
          </div>

          {/* Category Mapping Info */}
          {Object.keys(categoryMapping).length > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg border">
              <h5 className="font-medium text-blue-800 mb-2">XML Category Mappings:</h5>
              {Object.keys(categoryMapping).length === 1 && (
                <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                  <p className="text-yellow-800 font-medium">Single Category Feed</p>
                  <p className="text-yellow-700 text-xs">This feed contains products from only one category. All products will be imported to the selected category below.</p>
                </div>
              )}
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(categoryMapping).slice(0, 5).map(([xmlCategory, dbCategoryId]) => {
                  const dbCategory = categories.find(c => c.id === dbCategoryId);
                  const isSelected = selectedCategories.includes(dbCategoryId);
                  return (
                    <div key={xmlCategory} className="flex items-center justify-between text-sm">
                      <span className="font-mono text-blue-700">"{xmlCategory}"</span>
                      <span>→</span>
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${isSelected ? 'text-green-600' : 'text-gray-600'}`}>
                          {dbCategory?.name || 'Unknown'}
                        </span>
                        {isSelected && <CheckCircle className="w-4 h-4 text-green-500" />}
                      </div>
                    </div>
                  );
                })}
                {Object.keys(categoryMapping).length > 5 && (
                  <div className="text-sm text-blue-600 italic">
                    ... and {Object.keys(categoryMapping).length - 5} more mappings
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border rounded-md p-4">
            {/* Show mapped categories first */}
            {Object.entries(categoryMapping).map(([xmlCategory, dbCategoryId]) => {
              const dbCategory = categories.find(c => c.id === dbCategoryId);
              if (!dbCategory) return null;
              
              const isSelected = selectedCategories.includes(dbCategoryId);
              
              return (
                <div
                  key={dbCategoryId}
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                    isSelected 
                      ? 'bg-primary/10 border border-primary' 
                      : 'border border-blue-200 bg-blue-50'
                  }`}
                  onClick={() => handleCategoryToggle(dbCategoryId)}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="mr-2"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{dbCategory.name}</span>
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                        XML: {xmlCategory}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Show message if no mappings found */}
            {Object.keys(categoryMapping).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="font-medium">No category mappings detected</p>
                <p className="text-sm">This feed may not contain recognizable category information</p>
                <p className="text-xs mt-2">You can still select categories manually, but products may not be automatically categorized</p>
                
                {/* Show all categories as fallback */}
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium mb-2">All Available Categories:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.slice(0, 6).map(category => {
                      const isSelected = selectedCategories.includes(category.id);
                      return (
                        <div
                          key={category.id}
                          className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-muted transition-colors ${
                            isSelected ? 'bg-primary/10 border border-primary' : 'border'
                          }`}
                          onClick={() => handleCategoryToggle(category.id)}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mr-1"
                          />
                          <span className="text-sm">{category.name}</span>
                        </div>
                      );
                    })}
                  </div>
                  {categories.length > 6 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      ... and {categories.length - 6} more categories
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Import Preview */}
          {selectedCategories.length > 0 && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <h5 className="font-medium text-green-800 mb-2">📋 Import Preview:</h5>
              <div className="text-sm text-green-700 space-y-1">
                <div>• <strong>{selectedCategories.length}</strong> categories selected</div>
                <div>• <strong>{productsPerCategory}</strong> products per category</div>
                <div>• Total estimated products: <strong>~{selectedCategories.length * productsPerCategory}</strong></div>
                <div>• Affiliate links: <strong>{customAffiliateTemplate ? 'Custom template' : 'Feed default'}</strong></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Targeted Import</span>
            </CardTitle>
            <CardDescription>Import specific number of products to selected categories</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={startTargetedImport}
              disabled={importing || !selectedFeed || selectedCategories.length === 0}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Import {productsPerCategory} Products per Category
            </Button>
            {selectedCategories.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Total: ~{selectedCategories.length * productsPerCategory} products
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>Full Catalog</span>
            </CardTitle>
            <CardDescription>Import entire catalog with automatic categorization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <Label htmlFor="max-products">Maximum Products</Label>
                <Input
                  id="max-products"
                  type="number"
                  value={maxProducts}
                  onChange={(e) => setMaxProducts(parseInt(e.target.value))}
                  min={100}
                  max={10000}
                  step={100}
                />
              </div>
              <Button
                onClick={startFullImport}
                disabled={importing || !selectedFeed}
                className="w-full"
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Import Full Catalog
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import Progress */}
      {importing && (
        <Card>
          <CardHeader>
            <CardTitle>Import Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={importProgress} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              {importProgress < 100 ? 'Processing products...' : 'Import completed!'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Google Shopping CSS Ready */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800">Google Shopping CSS Ready</CardTitle>
          <CardDescription className="text-green-700">
            All imported products include complete metadata for Google Shopping CSS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-1 text-green-700">
            <li>✓ Structured product data with proper categorization</li>
            <li>✓ Rich descriptions and accurate pricing</li>
            <li>✓ High-quality product images</li>
            <li>✓ Market-specific affiliate links with tracking</li>
            <li>✓ Automatic currency and availability handling</li>
            <li>✓ SEO-optimized product titles and descriptions</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};