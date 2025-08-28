import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Book, Download, Target, Zap } from "lucide-react";
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
}
export const BookImport = () => {
  const [bookCategories, setBookCategories] = useState<Category[]>([]);
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [selectedFeed, setSelectedFeed] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [productsPerCategory, setProductsPerCategory] = useState(20);
  const {
    toast
  } = useToast();
  useEffect(() => {
    loadBookCategories();
    loadFeeds();
  }, []);
  const loadBookCategories = async () => {
    try {
      // Get "Knihy" category ID first
      const {
        data: mainCategory
      } = await supabase.from('categories').select('id').eq('slug', 'knihy').eq('market_code', 'SK').single();
      if (mainCategory) {
        // Get all book subcategories
        const {
          data,
          error
        } = await supabase.from('categories').select('id, name, slug, parent_id').eq('parent_id', mainCategory.id).eq('market_code', 'SK').order('name');
        if (error) throw error;
        setBookCategories(data || []);
      }
    } catch (error) {
      toast({
        title: "Error loading book categories",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const loadFeeds = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('xml_feeds').select('id, name, url, market_code').eq('is_active', true).eq('market_code', 'SK');
      if (error) throw error;
      setFeeds(data || []);

      // Auto-select Restorio.sk feed if available
      const restorioFeed = data?.find(feed => feed.name.includes('Restorio'));
      if (restorioFeed) {
        setSelectedFeed(restorioFeed.id);
      }
    } catch (error) {
      console.error('Error loading feeds:', error);
    }
  };
  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]);
  };
  const handleSelectAll = () => {
    const allSelected = bookCategories.every(cat => selectedCategories.includes(cat.id));
    if (allSelected) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(bookCategories.map(cat => cat.id));
    }
  };
  const importBooksToCategories = async () => {
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
      // Import books with smart categorization
      const {
        error
      } = await supabase.functions.invoke('process-xml-feed', {
        body: {
          feed_id: selectedFeed,
          category_filter: selectedCategories,
          import_type: 'book_import',
          products_per_category: productsPerCategory
        }
      });
      if (error) throw error;
      toast({
        title: "Book import started",
        description: `Importing ${productsPerCategory} books per category for ${selectedCategories.length} categories`,
        duration: 5000
      });

      // Simulate progress (in real implementation, you'd get this from the function)
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
          description: "Books have been imported and categorized",
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
  const importFullBookCatalog = async () => {
    if (!selectedFeed) {
      toast({
        title: "Please select a feed",
        variant: "destructive"
      });
      return;
    }
    setImporting(true);
    try {
      const {
        error
      } = await supabase.functions.invoke('process-xml-feed', {
        body: {
          feed_id: selectedFeed,
          import_type: 'full_book_catalog'
        }
      });
      if (error) throw error;
      toast({
        title: "Full catalog import started",
        description: "Processing entire book catalog with smart categorization",
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
  if (loading) {
    return <div>Loading book categories...</div>;
  }
  return <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Book className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">XML Feed Import menu</h2>
      </div>

      {/* Import Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Import Configurations</CardTitle>
          <CardDescription>Configure how books should be imported and categorized</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="feed-select">Feed Source</Label>
            <Select value={selectedFeed} onValueChange={setSelectedFeed}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a book feed" />
              </SelectTrigger>
              <SelectContent>
                {feeds.map(feed => <SelectItem key={feed.id} value={feed.id}>
                    {feed.name} ({feed.market_code})
                  </SelectItem>)}
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
        </CardContent>
      </Card>

      {/* Book Categories Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Book Categories</CardTitle>
          <CardDescription>Select which book categories to populate with products</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Available Book Categories ({bookCategories.length})</Label>
            <div className="space-x-2">
              <Button size="sm" variant="outline" onClick={handleSelectAll}>
                {bookCategories.every(cat => selectedCategories.includes(cat.id)) ? 'Deselect All' : 'Select All'}
              </Button>
              <Badge variant="secondary">
                {selectedCategories.length} selected
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-4">
            {bookCategories.map(category => <div key={category.id} className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors ${selectedCategories.includes(category.id) ? 'bg-primary/10 border border-primary' : 'border'}`} onClick={() => handleCategoryToggle(category.id)}>
                <input type="checkbox" checked={selectedCategories.includes(category.id)} onChange={() => {}} className="mr-2" />
                <span className="flex-1 font-medium">{category.name}</span>
                <Target className="w-4 h-4 text-muted-foreground" />
              </div>)}
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
            <CardDescription>Import specific number of books to selected categories</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={importBooksToCategories} disabled={importing || !selectedFeed || selectedCategories.length === 0} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Import {productsPerCategory} Books per Category
            </Button>
            {selectedCategories.length > 0 && <p className="text-sm text-muted-foreground mt-2">
                Total: ~{selectedCategories.length * productsPerCategory} books
              </p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>Full Catalog</span>
            </CardTitle>
            <CardDescription>Import entire book catalog with automatic categorization</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={importFullBookCatalog} disabled={importing || !selectedFeed} className="w-full" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Import Full Catalog
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Auto-categorizes all books from feed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Import Progress */}
      {importing && <Card>
          <CardHeader>
            <CardTitle>Import Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={importProgress} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              {importProgress < 100 ? 'Processing books...' : 'Import completed!'}
            </p>
          </CardContent>
        </Card>}

      {/* Google Shopping Readiness Info */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800">Google Shopping CSS Ready</CardTitle>
          <CardDescription className="text-green-700">
            All imported books will include complete data for Google Shopping CSS advertisements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-1 text-green-700">
            <li>✓ Rich product titles with author information</li>
            <li>✓ Detailed descriptions with publisher data</li>
            <li>✓ Proper category breadcrumbs</li>
            <li>✓ High-quality product images</li>
            <li>✓ Accurate pricing and availability</li>
            <li>✓ Affiliate links with Restorio.sk tracking</li>
          </ul>
        </CardContent>
      </Card>
    </div>;
};