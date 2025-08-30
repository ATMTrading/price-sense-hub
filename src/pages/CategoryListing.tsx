import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, Grid, List } from 'lucide-react';
import { Header } from '@/components/Layout/Header';
import { Footer } from '@/components/Layout/Footer';
import { ProductCard } from '@/components/ProductCard';
import { SubcategoryNav } from '@/components/SubcategoryNav';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMarket } from '@/hooks/useMarket';
import { translate, formatCurrency } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  original_price?: number;
  currency: string;
  shop: {
    id: string;
    name: string;
    logo_url?: string;
  };
  rating?: number;
  review_count?: number;
  availability: string;
  affiliate_links?: Array<{
    id: string;
    affiliate_url: string;
    tracking_code?: string;
  }>;
}

export default function CategoryListing() {
  const { categorySlug } = useParams();
  const { market } = useMarket();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [selectedMerchants, setSelectedMerchants] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [merchants, setMerchants] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [currentCategory, setCurrentCategory] = useState<any>(null);
  const [parentCategory, setParentCategory] = useState<any>(null);
  const [availabilityFilters, setAvailabilityFilters] = useState({
    in_stock: true,
    limited: false,
    out_of_stock: false
  });

  useEffect(() => {
    if (categorySlug) {
      fetchCurrentCategory();
    }
  }, [categorySlug, market]);

  useEffect(() => {
    if (currentCategory) {
      fetchProducts();
    }
  }, [currentCategory, market, priceRange, selectedMerchants, sortBy, availabilityFilters, searchQuery]);

  useEffect(() => {
    fetchMerchants();
  }, [market]);

  // Handle search functionality from header
  useEffect(() => {
    const handleHeaderSearch = (event: CustomEvent) => {
      const query = event.detail?.query;
      if (query) {
        setSearchQuery(query);
      }
    };

    window.addEventListener('headerSearch', handleHeaderSearch as EventListener);
    return () => {
      window.removeEventListener('headerSearch', handleHeaderSearch as EventListener);
    };
  }, []);

  const fetchCurrentCategory = async () => {
    if (!categorySlug) return;

    try {
      const { data: categoryData, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', categorySlug)
        .eq('market_code', market.code)
        .maybeSingle();

      if (error) throw error;

      if (categoryData) {
        setCurrentCategory(categoryData);

        // If this is a subcategory, fetch its parent
        if (categoryData.parent_id) {
          const { data: parentData } = await supabase
            .from('categories')
            .select('*')
            .eq('id', categoryData.parent_id)
            .maybeSingle();
          
          setParentCategory(parentData);
        } else {
          // This is a main category, so it's also the parent
          setParentCategory(categoryData);
        }
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      setCurrentCategory(null);
      setParentCategory(null);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Get all category IDs to search in (main category + subcategories)
      const categoryIds = [];
      if (currentCategory) {
        categoryIds.push(currentCategory.id);
        
        // Get subcategories if this is a main category
        const { data: subcategories } = await supabase
          .from('categories')
          .select('id')
          .eq('parent_id', currentCategory.id)
          .eq('is_active', true);
        
        if (subcategories) {
          categoryIds.push(...subcategories.map(sub => sub.id));
        }
      }

      let query = supabase
        .from('products')
        .select(`
          *,
          shop:shops(id, name, logo_url),
          affiliate_links(id, affiliate_url, tracking_code)
        `)
        .eq('market_code', market.code)
        .eq('is_active', true);

      // Apply category filter (search in main category and subcategories)
      if (categoryIds.length > 0) {
        query = query.in('category_id', categoryIds);
      }

      // Apply search filter - simplified
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Apply price range filter
      if (priceRange[0] > 0 || priceRange[1] < 10000) {
        query = query.gte('price', priceRange[0]).lte('price', priceRange[1]);
      }

      // Apply availability filter
      const activeAvailability = Object.entries(availabilityFilters)
        .filter(([_, active]) => active)
        .map(([status]) => status);
      
      if (activeAvailability.length > 0 && activeAvailability.length < 3) {
        const availabilityConditions = activeAvailability.map(filter => {
          switch (filter) {
            case 'in_stock': return 'availability.eq.in stock';
            case 'out_of_stock': return 'availability.eq.out of stock';
            case 'limited': return 'availability.eq.limited';
            default: return null;
          }
        }).filter(Boolean);
        
        if (availabilityConditions.length > 0) {
          query = query.or(availabilityConditions.join(','));
        }
      }

      // Apply merchant filter - simplified
      if (selectedMerchants.length > 0) {
        query = query.in('shop.name', selectedMerchants);
      }

      // Apply sorting
      switch (sortBy) {
        case 'price_low':
          query = query.order('price', { ascending: true });
          break;
        case 'price_high':
          query = query.order('price', { ascending: false });
          break;
        case 'rating':
          query = query.order('rating', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(50);

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      console.log('Fetched products:', data);
      
      // Transform the data to match our Product interface
      const transformedData = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        image_url: item.image_url,
        price: item.price,
        original_price: item.original_price,
        currency: item.currency,
        shop: item.shop,
        rating: item.rating,
        review_count: item.review_count,
        availability: item.availability,
        affiliate_links: Array.isArray(item.affiliate_links) 
          ? item.affiliate_links
          : (item.affiliate_links ? [item.affiliate_links] : [])
      }));
      
      setProducts(transformedData);
    } catch (error) {
      console.error('Error in fetchProducts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMerchants = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('name')
        .eq('market_code', market.code)
        .eq('is_active', true);

      if (error) throw error;

      setMerchants(data?.map(shop => shop.name) || []);
    } catch (error) {
      console.error('Error fetching merchants:', error);
      setMerchants([]);
    }
  };
  
  const categoryName = currentCategory?.name || 'Category';

  const toggleMerchant = (merchant: string) => {
    setSelectedMerchants(prev =>
      prev.includes(merchant)
        ? prev.filter(m => m !== merchant)
        : [...prev, merchant]
    );
  };

  const toggleAvailability = (availability: keyof typeof availabilityFilters) => {
    setAvailabilityFilters(prev => ({
      ...prev,
      [availability]: !prev[availability]
    }));
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const clearFilters = () => {
    setPriceRange([0, 2000]);
    setSelectedMerchants([]);
    setAvailabilityFilters({
      in_stock: true,
      limited: false,
      out_of_stock: false
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>{translate('nav.home', market)}</span>
            <span>/</span>
            <span>{translate('nav.categories', market)}</span>
            {parentCategory && currentCategory?.parent_id && (
              <>
                <span>/</span>
                <span>{parentCategory.name}</span>
              </>
            )}
            <span>/</span>
            <span className="text-foreground">{categoryName}</span>
          </div>
        </nav>

        {/* Subcategory Navigation */}
        {parentCategory && (
          <SubcategoryNav parentCategory={parentCategory} />
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar 
            onSearch={handleSearch}
            placeholder={`Hľadať v kategórii ${categoryName}...`}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold mb-2">{categoryName}</h1>
            <p className="text-muted-foreground">{products.length} {translate('product.productsFound', market)}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex rounded-md border">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={translate('filter.sortBy', market)} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">{translate('sort.relevance', market)}</SelectItem>
                <SelectItem value="price-low">{translate('sort.priceLow', market)}</SelectItem>
                <SelectItem value="price-high">{translate('sort.priceHigh', market)}</SelectItem>
                <SelectItem value="newest">{translate('sort.newest', market)}</SelectItem>
                <SelectItem value="rating">{translate('sort.rating', market)}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <aside className="w-80 flex-shrink-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <SlidersHorizontal className="h-5 w-5 mr-2" />
                  {translate('filter.filters', market)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price Range */}
                <div>
                  <h3 className="font-semibold mb-3">{translate('filter.priceRange', market)}</h3>
                  <div className="space-y-4">
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={2000}
                      min={0}
                      step={50}
                      className="w-full"
                    />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{formatCurrency(priceRange[0], market)}</span>
                      <span>{formatCurrency(priceRange[1], market)}</span>
                    </div>
                  </div>
                </div>

                {/* Merchants */}
                <div>
                  <h3 className="font-semibold mb-3">{translate('filter.merchant', market)}</h3>
                  <div className="space-y-3">
                    {merchants.map((merchant) => (
                      <div key={merchant} className="flex items-center space-x-2">
                        <Checkbox
                          id={merchant}
                          checked={selectedMerchants.includes(merchant)}
                          onCheckedChange={() => toggleMerchant(merchant)}
                        />
                        <label htmlFor={merchant} className="text-sm font-medium">
                          {merchant}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <h3 className="font-semibold mb-3">{translate('filter.availability', market)}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="in-stock" 
                        checked={availabilityFilters.in_stock}
                        onCheckedChange={() => toggleAvailability('in_stock')}
                      />
                      <label htmlFor="in-stock" className="text-sm font-medium">
                        {translate('availability.inStock', market)}
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="limited-stock" 
                        checked={availabilityFilters.limited}
                        onCheckedChange={() => toggleAvailability('limited')}
                      />
                      <label htmlFor="limited-stock" className="text-sm font-medium">
                        {translate('availability.limitedStock', market)}
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="out-of-stock" 
                        checked={availabilityFilters.out_of_stock}
                        onCheckedChange={() => toggleAvailability('out_of_stock')}
                      />
                      <label htmlFor="out-of-stock" className="text-sm font-medium">
                        Out of Stock
                      </label>
                    </div>
                  </div>
                </div>

                <Button className="w-full" variant="outline" onClick={clearFilters}>
                  {translate('btn.clearFilters', market)}
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'space-y-4'
              }>
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-80 w-full" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                    : 'space-y-4'
                }>
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Load More */}
                <div className="flex justify-center mt-12">
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={async () => {
                      // Load more products logic here
                      console.log('Loading more products...');
                    }}
                  >
                    {translate('btn.loadMore', market)}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or browse other categories
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}