import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Star } from "lucide-react";

interface Product {
  id: string;
  title: string;
  price: number;
  original_price: number | null;
  currency: string;
  image_url: string;
  is_active: boolean;
  is_featured: boolean;
  availability: string;
  created_at: string;
}

export const ProductManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    loadProducts(true);
  }, [searchTerm]);

  const loadProducts = async (reset = false) => {
    try {
      const currentPage = reset ? 0 : page;
      let query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .range(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE - 1);

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (reset) {
        setProducts(data || []);
        setPage(0);
      } else {
        setProducts(prev => [...prev, ...(data || [])]);
      }

      setHasMore(data && data.length === ITEMS_PER_PAGE);
    } catch (error) {
      toast({
        title: "Error loading products",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
    loadProducts(false);
  };

  const toggleFeatured = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.functions.invoke('admin-operations', {
        body: {
          action: 'update_product',
          data: {
            id: productId,
            is_featured: !currentStatus
          }
        }
      });

      if (error) throw error;

      setProducts(prev => prev.map(product => 
        product.id === productId 
          ? { ...product, is_featured: !currentStatus }
          : product
      ));

      toast({
        title: "Product updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error updating product",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price);
  };

  if (loading && products.length === 0) {
    return <div>Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Products</h2>
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <img 
                    src={product.image_url} 
                    alt={product.title}
                    className="w-16 h-16 object-cover rounded-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      {product.title}
                      <div className="flex gap-1">
                        <Badge variant={product.is_active ? "default" : "secondary"}>
                          {product.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {product.is_featured && (
                          <Badge variant="outline">Featured</Badge>
                        )}
                        <Badge variant="outline">{product.availability}</Badge>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      Created: {new Date(product.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={product.is_featured ? "default" : "outline"}
                  onClick={() => toggleFeatured(product.id, product.is_featured)}
                >
                  <Star className={`w-4 h-4 mr-1 ${product.is_featured ? 'fill-current' : ''}`} />
                  {product.is_featured ? 'Unfeature' : 'Feature'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-sm">
                <div className="flex gap-4">
                  <div>
                    <p className="font-medium">Price</p>
                    <p className="text-lg font-bold text-primary">
                      {formatPrice(product.price, product.currency)}
                    </p>
                    {product.original_price && product.original_price > product.price && (
                      <p className="text-sm text-muted-foreground line-through">
                        {formatPrice(product.original_price, product.currency)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {hasMore && (
        <div className="text-center">
          <Button onClick={loadMore} variant="outline">
            Load More Products
          </Button>
        </div>
      )}

      {products.length === 0 && !loading && (
        <Alert>
          <AlertDescription>
            {searchTerm 
              ? `No products found matching "${searchTerm}"`
              : "No products found. Import some products first."
            }
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};