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
import { Settings, Download, Target, Zap, Eye, Copy, CheckCircle, AlertCircle } from "lucide-react";

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
  const { toast } = useToast();

  useEffect(() => {
    loadCategories();
    loadFeeds();
  }, [market]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, parent_id')
        .eq('market_code', market.code)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
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
        .eq('market_code', market.code);

      if (error) throw error;
      setFeeds(data || []);

      // Auto-select first feed if available
      if (data && data.length > 0) {
        setSelectedFeed(data[0].id);
        loadFeedStructure(data[0].id);
      }
    } catch (error) {
      console.error('Error loading feeds:', error);
    }
  };

  const loadFeedStructure = async (feedId: string) => {
    const feed = feeds.find(f => f.id === feedId);
    if (!feed) return;

    try {
      // Get stored structure or analyze the feed
      const { data, error } = await supabase.functions.invoke('debug-xml', {
        body: { feed_url: feed.url }
      });

      if (error) throw error;

      setFeedStructure(data);
      setAffiliateTemplate(feed.affiliate_link_template ? JSON.stringify(feed.affiliate_link_template, null, 2) : "");
    } catch (error) {
      console.error('Error loading feed structure:', error);
      toast({
        title: "Error analyzing feed structure",
        description: "Could not analyze the XML feed structure",
        variant: "destructive"
      });
    }
  };

  const handleFeedChange = (feedId: string) => {
    setSelectedFeed(feedId);
    loadFeedStructure(feedId);
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
      const { error } = await supabase.functions.invoke('process-xml-feed', {
        body: {
          feed_id: selectedFeed,
          category_filter: selectedCategories,
          import_type: 'targeted_import',
          products_per_category: productsPerCategory,
          market_code: market.code
        }
      });

      if (error) throw error;

      toast({
        title: "Import started",
        description: `Importing ${productsPerCategory} products per category for ${selectedCategories.length} categories`,
        duration: 5000
      });

      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 5;
        });
      }, 1000);

      setTimeout(() => {
        setImportProgress(100);
        clearInterval(progressInterval);
        setImporting(false);
        toast({
          title: "Import completed!",
          description: "Products have been imported and categorized",
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
          market_code: market.code
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

          {/* Feed Structure Info */}
          {feedStructure && selectedFeedData && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Feed Structure Analysis</h4>
                <Dialog open={showStructure} onOpenChange={setShowStructure}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Feed Structure: {selectedFeedData.name}</DialogTitle>
                      <DialogDescription>
                        Detailed analysis of XML feed structure and configuration
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                      {/* Validation Status */}
                      <div className="flex items-center space-x-2">
                        {feedStructure.isValid ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                        <span className={feedStructure.isValid ? "text-green-600" : "text-red-600"}>
                          {feedStructure.isValid ? "Valid XML Feed" : "Invalid XML Feed"}
                        </span>
                      </div>

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
                        <h4 className="font-semibold mb-2">Detected Fields ({feedStructure.detectedFields.length})</h4>
                        <div className="flex flex-wrap gap-1">
                          {feedStructure.detectedFields.map(field => (
                            <Badge key={field} variant="outline" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Suggested Mapping */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">Suggested Field Mapping</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(JSON.stringify(feedStructure.suggestedMapping, null, 2))}
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <Textarea
                          value={JSON.stringify(feedStructure.suggestedMapping, null, 2)}
                          readOnly
                          className="font-mono text-sm"
                          rows={8}
                        />
                      </div>

                      {/* Affiliate Template */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">Affiliate Link Template</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(affiliateTemplate)}
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <Textarea
                          value={affiliateTemplate}
                          readOnly
                          placeholder="No affiliate template configured"
                          className="font-mono text-sm"
                          rows={6}
                        />
                      </div>

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
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Status: </span>
                  {feedStructure.isValid ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">Valid</Badge>
                  ) : (
                    <Badge variant="destructive">Invalid</Badge>
                  )}
                </div>
                <div>
                  <span className="font-medium">Fields: </span>
                  {feedStructure.detectedFields.length}
                </div>
                <div>
                  <span className="font-medium">Products: </span>
                  {feedStructure.feedOverview?.totalProducts || 0}
                </div>
              </div>

              {feedStructure.warnings.length > 0 && (
                <div className="mt-3 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                  <p className="text-sm font-medium text-yellow-800">Warnings:</p>
                  <ul className="text-sm text-yellow-700 list-disc list-inside">
                    {feedStructure.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Category Selection</CardTitle>
          <CardDescription>Select categories to import products into</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Available Categories ({categories.length})</Label>
            <div className="space-x-2">
              <Button size="sm" variant="outline" onClick={handleSelectAll}>
                {categories.every(cat => selectedCategories.includes(cat.id)) ? 'Deselect All' : 'Select All'}
              </Button>
              <Badge variant="secondary">
                {selectedCategories.length} selected
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-4">
            {categories.map(category => (
              <div
                key={category.id}
                className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                  selectedCategories.includes(category.id) 
                    ? 'bg-primary/10 border border-primary' 
                    : 'border'
                }`}
                onClick={() => handleCategoryToggle(category.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => {}}
                  className="mr-2"
                />
                <span className="flex-1 font-medium">{category.name}</span>
                <Target className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </div>
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