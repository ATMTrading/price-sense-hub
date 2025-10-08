import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  shop?: {
    id: string;
    name: string;
    logo_url?: string;
  };
  availability: string;
  affiliate_links?: Array<{
    id: string;
    affiliate_url: string;
    tracking_code?: string;
  }>;
}

interface ChildCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
}

export default function CategoryListing() {
  const { categorySlug } = useParams();
  const { market } = useMarket();
  const marketCode = market?.code ? market.code.toUpperCase() : undefined;
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [selectedMerchants, setSelectedMerchants] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [merchants, setMerchants] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [currentCategory, setCurrentCategory] = useState<any>(null);
  const [parentCategory, setParentCategory] = useState<any>(null);
  const [childCategories, setChildCategories] = useState<ChildCategory[] | null>(null);
  const [availabilityFilters, setAvailabilityFilters] = useState({
    in_stock: true,
    limited: false,
    out_of_stock: false
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PRODUCTS_PER_PAGE = 20;

  useEffect(() => {
    if (categorySlug && marketCode) {
      fetchCurrentCategory();
    }
  }, [categorySlug, marketCode]);

  useEffect(() => {
    if (currentCategory && marketCode) {
      fetchProducts(1, false);
    }
  }, [currentCategory, marketCode, priceRange, selectedMerchants, sortBy, availabilityFilters, searchQuery]);

  const fetchChildCategories = useCallback(async (parentId: string) => {
    if (!parentId || !marketCode) {
      setChildCategories([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, description, image_url')
        .eq('parent_id', parentId)
        .eq('market_code', marketCode)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setChildCategories(data || []);
    } catch (error) {
      console.error('Error fetching child categories:', error);
      setChildCategories([]);
    }
  }, [marketCode]);

  useEffect(() => {
    if (!currentCategory) {
      setChildCategories(null);
      return;
    }

    setChildCategories(null);
    fetchChildCategories(currentCategory.id);
  }, [currentCategory, fetchChildCategories]);

  const collectCategoryScope = useCallback(async (): Promise<string[]> => {
    if (!currentCategory || !marketCode) {
      return [];
    }

    const ids = [currentCategory.id];

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', currentCategory.id)
        .eq('market_code', marketCode)
        .eq('is_active', true);

      if (error) throw error;

      if (data) {
        ids.push(...data.map(sub => sub.id));
      }
    } catch (error) {
      console.error('Error collecting category scope:', error);
    }

    return ids;
  }, [currentCategory, marketCode]);

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
    if (!categorySlug || !marketCode) return;

    try {
      const { data: categoryData, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', categorySlug)
        .eq('market_code', marketCode)
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

  const fetchProducts = async (page = 1, append = false) => {
    if (!marketCode) {
      if (page === 1) {
        setLoading(false);
      }
      setLoadingMore(false);
      return;
    }

    if (page === 1) {
      setLoading(true);
      setCurrentPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const categoryIds = currentCategory ? await collectCategoryScope() : [];

      let query = supabase
        .from('products')
        .select(`
          id,
          title,
          description,
          image_url,
          price,
          original_price,
          currency,
          availability,
          category_id,
          merchant_name,
          affiliate_url,
          shop_id
        `)
        .eq('market_code', marketCode)
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
        query = query.in('merchant_name', selectedMerchants);
      }

      // Apply sorting
      switch (sortBy) {
        case 'price_low':
          query = query.order('price', { ascending: true });
          break;
        case 'price_high':
          query = query.order('price', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Add pagination
      const from = (page - 1) * PRODUCTS_PER_PAGE;
      const to = from + PRODUCTS_PER_PAGE - 1;

      const { data, error } = await query
        .range(from, to)
        .limit(PRODUCTS_PER_PAGE + 1); // Get one extra to check if there are more

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      // Check if there are more products
      const hasMoreProducts = data && data.length > PRODUCTS_PER_PAGE;
      const productsToShow = hasMoreProducts ? data.slice(0, PRODUCTS_PER_PAGE) : data || [];

      setHasMore(hasMoreProducts);

      // Transform the data to match our Product interface
      const transformedData = productsToShow.map(item => ({
        id: item.id,
        title: item.title,
        image_url: item.image_url,
        price: item.price,
        original_price: item.original_price,
        currency: item.currency,
        shop: item.merchant_name
          ? {
              id: item.merchant_name,
              name: item.merchant_name,
            }
          : undefined,
        availability: item.availability,
        affiliate_links: item.affiliate_url
          ? [{
              id: `${item.id}-affiliate`,
              affiliate_url: item.affiliate_url,
              tracking_code: undefined,
            }]
          : []
      }));

      if (append) {
        setProducts(prev => [...prev, ...transformedData]);
      } else {
        setProducts(transformedData);
      }
    } catch (error) {
      console.error('Error in fetchProducts:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchMerchants = useCallback(async () => {
    if (!marketCode || !currentCategory) {
      setMerchants([]);
      return;
    }

    try {
      const categoryIds = await collectCategoryScope();
      if (!categoryIds.length) {
        setMerchants([]);
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('merchant_name')
        .eq('market_code', marketCode)
        .eq('is_active', true)
        .in('category_id', categoryIds)
        .not('merchant_name', 'is', null);

      if (error) throw error;

      const merchantNames = (data || [])
        .map(item => (item.merchant_name || '').trim())
        .filter((name): name is string => name.length > 0);

      const uniqueMerchants = Array.from(new Set(merchantNames)).sort((a, b) => a.localeCompare(b));

      setMerchants(uniqueMerchants);
    } catch (error) {
      console.error('Error fetching merchants:', error);
      setMerchants([]);
    }
  }, [collectCategoryScope, currentCategory, marketCode]);

  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  const handleProductClick = (product: Product) => {
    // Navigate to the current category showing related products
    // Add category description and highlight similar products
    setSearchQuery(''); // Clear any search filters to show all category products

    // Scroll to top to show category info
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Could also highlight the clicked product or show a "related to" message
    console.log('Product clicked:', product.title, 'in category:', categoryName);
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

        {/* Header with Category Description */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            <h1 className="font-heading text-3xl font-bold mb-2">{categoryName}</h1>
            {currentCategory?.description && (
              <p className="text-muted-foreground mb-4 max-w-3xl leading-relaxed">
                {currentCategory.description}
              </p>
            )}
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
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Child Categories Grid */}
        {currentCategory && (
          childCategories === null ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-24 w-full" />
              ))}
            </div>
          ) : childCategories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {childCategories.map((childCategory) => (
                <Link key={childCategory.id} to={`/c/${childCategory.slug}`} className="block">
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg">{childCategory.name}</h3>
                      {childCategory.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                          {childCategory.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : null
        )}

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
                     <ProductCard
                       key={product.id}
                       product={product}
                       onProductClick={handleProductClick}
                     />
                   ))}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="flex justify-center mt-12">
                    <Button
                      size="lg"
                      variant="outline"
                      disabled={loadingMore}
                      onClick={() => {
                        const nextPage = currentPage + 1;
                        setCurrentPage(nextPage);
                        fetchProducts(nextPage, true);
                      }}
                    >
                      {loadingMore ? 'Načítavam...' : translate('btn.loadMore', market)}
                    </Button>
                  </div>
                )}
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
