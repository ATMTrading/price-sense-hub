import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Download, Search, Filter } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  market_code: string;
  is_active: boolean;
}

interface Feed {
  id: string;
  name: string;
  url: string;
  market_code: string;
}

export const CategoryImport = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [selectedFeed, setSelectedFeed] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [marketFilter, setMarketFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    loadCategories();
    loadFeeds();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
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
        .select('id, name, url, market_code')
        .eq('is_active', true);

      if (error) throw error;
      setFeeds(data || []);
    } catch (error) {
      console.error('Error loading feeds:', error);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSelectAll = () => {
    const filteredCategories = getFilteredCategories();
    const allSelected = filteredCategories.every(cat => selectedCategories.includes(cat.id));
    
    if (allSelected) {
      setSelectedCategories(prev => 
        prev.filter(id => !filteredCategories.some(cat => cat.id === id))
      );
    } else {
      setSelectedCategories(prev => [
        ...prev,
        ...filteredCategories.map(cat => cat.id).filter(id => !prev.includes(id))
      ]);
    }
  };

  const importSelectedCategories = async () => {
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

    try {
      const { error } = await supabase.functions.invoke('process-xml-feed', {
        body: {
          feed_id: selectedFeed,
          category_filter: selectedCategories,
          import_type: 'category_specific'
        }
      });

      if (error) throw error;

      toast({
        title: "Category import started",
        description: `Importing products for ${selectedCategories.length} categories`
      });

      setSelectedCategories([]);
    } catch (error) {
      toast({
        title: "Error starting import",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const importSingleProduct = async () => {
    const productUrl = (document.getElementById('product-url') as HTMLInputElement)?.value;
    
    if (!productUrl) {
      toast({
        title: "Please enter a product URL",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('admin-operations', {
        body: {
          action: 'import_single_product',
          data: { url: productUrl }
        }
      });

      if (error) throw error;

      toast({
        title: "Product import started",
        description: "Processing single product import"
      });

      (document.getElementById('product-url') as HTMLInputElement).value = '';
    } catch (error) {
      toast({
        title: "Error importing product",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const getFilteredCategories = () => {
    return categories.filter(category => {
      const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMarket = marketFilter === 'all' || category.market_code === marketFilter;
      return matchesSearch && matchesMarket;
    });
  };

  const filteredCategories = getFilteredCategories();
  const markets = [...new Set(categories.map(cat => cat.market_code))];

  if (loading) {
    return <div>Loading categories...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Category & Product Import</h2>

      {/* Single Product Import */}
      <Card>
        <CardHeader>
          <CardTitle>Import Single Product</CardTitle>
          <CardDescription>Import a specific product by URL</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="product-url">Product URL</Label>
            <Input
              id="product-url"
              placeholder="https://example.com/product/123"
              type="url"
            />
          </div>
          <Button onClick={importSingleProduct}>
            <Download className="w-4 h-4 mr-2" />
            Import Product
          </Button>
        </CardContent>
      </Card>

      {/* Category-based Import */}
      <Card>
        <CardHeader>
          <CardTitle>Import by Categories</CardTitle>
          <CardDescription>Select categories to import products from a specific feed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="feed-select">Select Feed</Label>
            <Select value={selectedFeed} onValueChange={setSelectedFeed}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a feed source" />
              </SelectTrigger>
              <SelectContent>
                {feeds.map((feed) => (
                  <SelectItem key={feed.id} value={feed.id}>
                    {feed.name} ({feed.market_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Categories</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="market-filter">Market</Label>
              <Select value={marketFilter} onValueChange={setMarketFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {markets.map((market) => (
                    <SelectItem key={market} value={market}>{market.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Categories ({filteredCategories.length})</Label>
              <div className="space-x-2">
                <Button size="sm" variant="outline" onClick={handleSelectAll}>
                  {filteredCategories.every(cat => selectedCategories.includes(cat.id)) ? 'Deselect All' : 'Select All'}
                </Button>
                <Badge variant="secondary">
                  {selectedCategories.length} selected
                </Badge>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto border rounded-md p-2 space-y-1">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-muted ${
                    selectedCategories.includes(category.id) ? 'bg-muted' : ''
                  }`}
                  onClick={() => handleCategoryToggle(category.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => {}}
                    className="mr-2"
                  />
                  <span className="flex-1">{category.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {category.market_code}
                  </Badge>
                  <Badge variant={category.is_active ? "default" : "secondary"} className="text-xs">
                    {category.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <Button 
            onClick={importSelectedCategories} 
            disabled={importing || !selectedFeed || selectedCategories.length === 0}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            {importing ? 'Importing...' : `Import Products (${selectedCategories.length} categories)`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};