import { useState, useEffect } from 'react';
import { Header } from '@/components/Layout/Header';
import { Footer } from '@/components/Layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMarket } from '@/hooks/useMarket';
import { Plus, Upload, Eye, Edit, Trash } from 'lucide-react';

interface Shop {
  id: string;
  name: string;
  logo_url?: string;
  website_url?: string;
  market_code: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  market_code: string;
}

interface Product {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  price: number;
  original_price?: number;
  currency: string;
  market_code: string;
  shop: Shop;
  category: Category;
  availability: string;
  is_featured: boolean;
  is_active: boolean;
}

export function Admin() {
  const [activeTab, setActiveTab] = useState('products');
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const { market } = useMarket();
  const { toast } = useToast();

  // Product form state
  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    image_url: '',
    price: '',
    original_price: '',
    shop_id: '',
    category_id: '',
    affiliate_url: '',
    tracking_code: '',
    availability: 'in_stock',
    is_featured: false
  });

  // Shop form state
  const [shopForm, setShopForm] = useState({
    name: '',
    logo_url: '',
    website_url: ''
  });

  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, [market]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchShops(),
        fetchCategories(),
        fetchProducts()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchShops = async () => {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('market_code', market.code)
      .eq('is_active', true);
    
    if (error) throw error;
    setShops(data || []);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('market_code', market.code)
      .eq('is_active', true);
    
    if (error) throw error;
    setCategories(data || []);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        shop:shops(*),
        category:categories(*)
      `)
      .eq('market_code', market.code)
      .eq('is_active', true);
    
    if (error) throw error;
    setProducts(data || []);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Insert product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          title: productForm.title,
          description: productForm.description,
          image_url: productForm.image_url,
          price: parseFloat(productForm.price),
          original_price: productForm.original_price ? parseFloat(productForm.original_price) : null,
          currency: market.currency,
          market_code: market.code,
          shop_id: productForm.shop_id,
          category_id: productForm.category_id,
          availability: productForm.availability,
          is_featured: productForm.is_featured
        })
        .select()
        .single();

      if (productError) throw productError;

      // Insert affiliate link
      const { error: affiliateError } = await supabase
        .from('affiliate_links')
        .insert({
          product_id: product.id,
          affiliate_url: productForm.affiliate_url,
          tracking_code: productForm.tracking_code || null
        });

      if (affiliateError) throw affiliateError;

      toast({
        title: "Success",
        description: "Product added successfully"
      });

      // Reset form
      setProductForm({
        title: '',
        description: '',
        image_url: '',
        price: '',
        original_price: '',
        shop_id: '',
        category_id: '',
        affiliate_url: '',
        tracking_code: '',
        availability: 'in_stock',
        is_featured: false
      });

      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('shops')
        .insert({
          name: shopForm.name,
          logo_url: shopForm.logo_url || null,
          website_url: shopForm.website_url || null,
          market_code: market.code
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Shop added successfully"
      });

      setShopForm({
        name: '',
        logo_url: '',
        website_url: ''
      });

      fetchShops();
    } catch (error) {
      console.error('Error adding shop:', error);
      toast({
        title: "Error",
        description: "Failed to add shop",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('categories')
        .insert({
          name: categoryForm.name,
          slug: categoryForm.slug,
          description: categoryForm.description || null,
          market_code: market.code
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category added successfully"
      });

      setCategoryForm({
        name: '',
        slug: '',
        description: ''
      });

      fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage products, shops, and categories for {market.code}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="shops">Shops</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Product
                </CardTitle>
                <CardDescription>
                  Add a new product to the {market.code} marketplace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProductSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Product Title</Label>
                      <Input
                        id="title"
                        value={productForm.title}
                        onChange={(e) => setProductForm({...productForm, title: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="image_url">Image URL</Label>
                      <Input
                        id="image_url"
                        value={productForm.image_url}
                        onChange={(e) => setProductForm({...productForm, image_url: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={productForm.price}
                        onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="original_price">Original Price (optional)</Label>
                      <Input
                        id="original_price"
                        type="number"
                        step="0.01"
                        value={productForm.original_price}
                        onChange={(e) => setProductForm({...productForm, original_price: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="shop">Shop</Label>
                      <Select value={productForm.shop_id} onValueChange={(value) => setProductForm({...productForm, shop_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a shop" />
                        </SelectTrigger>
                        <SelectContent>
                          {shops.map((shop) => (
                            <SelectItem key={shop.id} value={shop.id}>
                              {shop.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={productForm.category_id} onValueChange={(value) => setProductForm({...productForm, category_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={productForm.description}
                      onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="affiliate_url">Affiliate URL</Label>
                    <Input
                      id="affiliate_url"
                      value={productForm.affiliate_url}
                      onChange={(e) => setProductForm({...productForm, affiliate_url: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="tracking_code">Tracking Code (optional)</Label>
                    <Input
                      id="tracking_code"
                      value={productForm.tracking_code}
                      onChange={(e) => setProductForm({...productForm, tracking_code: e.target.value})}
                    />
                  </div>

                  <Button type="submit" disabled={loading}>
                    <Upload className="h-4 w-4 mr-2" />
                    {loading ? 'Adding...' : 'Add Product'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Products List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <img src={product.image_url} alt={product.title} className="w-16 h-16 object-cover rounded" />
                        <div>
                          <h3 className="font-semibold">{product.title}</h3>
                          <p className="text-sm text-muted-foreground">{product.shop.name} • {product.category.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={product.availability === 'in_stock' ? 'default' : 'secondary'}>
                              {product.availability}
                            </Badge>
                            {product.is_featured && <Badge variant="outline">Featured</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{product.price} {product.currency}</p>
                        {product.original_price && (
                          <p className="text-sm text-muted-foreground line-through">
                            {product.original_price} {product.currency}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shops" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Shop</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleShopSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="shop_name">Shop Name</Label>
                    <Input
                      id="shop_name"
                      value={shopForm.name}
                      onChange={(e) => setShopForm({...shopForm, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="logo_url">Logo URL</Label>
                    <Input
                      id="logo_url"
                      value={shopForm.logo_url}
                      onChange={(e) => setShopForm({...shopForm, logo_url: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="website_url">Website URL</Label>
                    <Input
                      id="website_url"
                      value={shopForm.website_url}
                      onChange={(e) => setShopForm({...shopForm, website_url: e.target.value})}
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    Add Shop
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shops List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {shops.map((shop) => (
                    <div key={shop.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        {shop.logo_url && (
                          <img src={shop.logo_url} alt={shop.name} className="w-8 h-8 object-cover rounded" />
                        )}
                        <span className="font-medium">{shop.name}</span>
                      </div>
                      <Badge variant="outline">{shop.market_code}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Category</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="category_name">Category Name</Label>
                    <Input
                      id="category_name"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category_slug">Slug</Label>
                    <Input
                      id="category_slug"
                      value={categoryForm.slug}
                      onChange={(e) => setCategoryForm({...categoryForm, slug: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category_description">Description</Label>
                    <Textarea
                      id="category_description"
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    Add Category
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Categories List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <span className="font-medium">{category.name}</span>
                        <p className="text-sm text-muted-foreground">/{category.slug}</p>
                      </div>
                      <Badge variant="outline">{category.market_code}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{products.length}</div>
                  <p className="text-sm text-muted-foreground">Active products in {market.code}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Shops</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{shops.length}</div>
                  <p className="text-sm text-muted-foreground">Connected shops</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{categories.length}</div>
                  <p className="text-sm text-muted-foreground">Available categories</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}