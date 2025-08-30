import { useState, useEffect } from 'react';
import { Home, Shirt, Heart, Baby, Dumbbell, Cpu } from 'lucide-react';
import { Header } from '@/components/Layout/Header';
import { Footer } from '@/components/Layout/Footer';
import { CategoryCard } from '@/components/CategoryCard';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { useMarket } from '@/hooks/useMarket';
import { translate } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { GoogleShoppingMeta } from '@/components/GoogleShoppingMeta';
import { useNavigate } from 'react-router-dom';

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
  availability: 'in_stock' | 'out_of_stock' | 'limited';
  affiliate_links?: Array<{
    affiliate_url: string;
    tracking_code?: string;
  }>;
}

const Index = () => {
  const { market } = useMarket();
  const navigate = useNavigate();
  const [topDeals, setTopDeals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchTopDeals();
    fetchCategories();
  }, [market]);

  // Listen for search events from header
  useEffect(() => {
    const handleHeaderSearch = (event: CustomEvent) => {
      const query = event.detail.query;
      setSearchQuery(query);
      handleSearch(query);
    };

    // Check URL params for search on page load
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
      handleSearch(searchParam);
    }

    window.addEventListener('header-search', handleHeaderSearch as EventListener);
    return () => {
      window.removeEventListener('header-search', handleHeaderSearch as EventListener);
    };
  }, [market]);

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      fetchTopDeals();
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          shop:shops(*),
          affiliate_links(*)
        `)
        .eq('market_code', market.code)
        .eq('is_active', true)
        .or(`title.ilike.%${searchTerm}%,shop.name.ilike.%${searchTerm}%`)
        .limit(8);

      if (error) throw error;

      const searchResults = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        image_url: item.image_url,
        price: item.price,
        original_price: item.original_price,
        currency: item.currency,
        shop: item.shop,
        rating: item.rating,
        review_count: item.review_count,
        availability: item.availability as 'in_stock' | 'out_of_stock' | 'limited',
        affiliate_links: Array.isArray(item.affiliate_links) 
          ? item.affiliate_links.map(link => ({
              affiliate_url: link.affiliate_url,
              tracking_code: link.tracking_code
            }))
          : []
      }));

      setTopDeals(searchResults);
    } catch (error) {
      console.error('❌ Search error:', error);
      // Fallback: try searching by shop name separately
      try {
        const { data: shopData } = await supabase
          .from('shops')
          .select('id')
          .ilike('name', `%${searchTerm}%`)
          .eq('market_code', market.code)
          .eq('is_active', true);

        if (shopData && shopData.length > 0) {
          const { data: productsByShop, error: shopError } = await supabase
            .from('products')
            .select(`
              *,
              shop:shops(*),
              affiliate_links(*)
            `)
            .eq('market_code', market.code)
            .eq('is_active', true)
            .in('shop_id', shopData.map(shop => shop.id))
            .limit(8);

          if (!shopError && productsByShop) {
            const searchResults = productsByShop.map(item => ({
              id: item.id,
              title: item.title,
              image_url: item.image_url,
              price: item.price,
              original_price: item.original_price,
              currency: item.currency,
              shop: item.shop,
              rating: item.rating,
              review_count: item.review_count,
              availability: item.availability as 'in_stock' | 'out_of_stock' | 'limited',
              affiliate_links: Array.isArray(item.affiliate_links) 
                ? item.affiliate_links.map(link => ({
                    affiliate_url: link.affiliate_url,
                    tracking_code: link.tracking_code
                  }))
                : []
            }));
            setTopDeals(searchResults);
          } else {
            setTopDeals([]);
          }
        } else {
          setTopDeals([]);
        }
      } catch (fallbackError) {
        console.error('❌ Fallback search error:', fallbackError);
        setTopDeals([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // Fetch only parent categories (main categories)
      const { data: categoriesData, error } = await supabase
        .from('categories')
        .select('*')
        .eq('market_code', market.code)
        .eq('is_active', true)
        .is('parent_id', null);

      if (error) throw error;

      // Get product counts for each main category (including products from subcategories)
      const categoriesWithCounts = await Promise.all(
        (categoriesData || []).map(async (category) => {
          // Get all subcategories for this main category
          const { data: subcategories } = await supabase
            .from('categories')
            .select('id')
            .eq('parent_id', category.id)
            .eq('is_active', true);

          // Get all category IDs (main + subcategories)
          const categoryIds = [category.id, ...(subcategories || []).map(sub => sub.id)];

          // Count products in main category and all its subcategories
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .in('category_id', categoryIds)
            .eq('is_active', true);

          return {
            title: category.name,
            slug: category.slug,
            icon: getIconForCategory(category.slug),
            productCount: count || 0
          };
        })
      );

      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to all main categories
      setCategories([
        {
          title: 'Elektronika',
          slug: 'elektronika',
          icon: Cpu,
          productCount: 0
        },
        {
          title: 'Móda a Oblečenie',
          slug: 'moda-a-oblecenie',
          icon: Shirt,
          productCount: 0
        },
        {
          title: 'Zdravie a Krása',
          slug: 'zdravie-a-krasa',
          icon: Heart,
          productCount: 0
        },
        {
          title: 'Domov a Záhrada',
          slug: 'domov-a-zahrada',
          icon: Home,
          productCount: 0
        },
        {
          title: 'Šport a Voľný čas',
          slug: 'sport-a-volny-cas',
          icon: Dumbbell,
          productCount: 0
        },
        {
          title: 'Deti a Bábätká',
          slug: 'deti-a-babatka',
          icon: Baby,
          productCount: 0
        },
        {
          title: 'Knihy a Médiá',
          slug: 'knihy-a-media',
          icon: Cpu,
          productCount: 0
        },
        {
          title: 'Auto a Motocykle',
          slug: 'auto-a-motocykle',
          icon: Cpu,
          productCount: 0
        }
      ]);
    }
  };

  const getIconForCategory = (slug: string) => {
    const iconMap: { [key: string]: any } = {
      elektronika: Cpu,
      'moda-a-oblecenie': Shirt,
      'zdravie-a-krasa': Heart,
      'domov-a-zahrada': Home,
      'deti-a-babatka': Baby,
      'sport-a-volny-cas': Dumbbell,
      'knihy-a-media': Cpu,
      'auto-a-motocykle': Cpu,
      // Legacy support
      electronics: Cpu,
      fashion: Shirt,
      'health-beauty': Heart,
      'home-garden': Home,
      'baby-kids': Baby,
      sports: Dumbbell,
      'books-media': Cpu,
      automotive: Cpu
    };
    return iconMap[slug.toLowerCase()] || Cpu;
  };


  const fetchTopDeals = async () => {
    console.log('🔍 Fetching top deals for market:', market.code);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          shop:shops(*),
          affiliate_links(*)
        `)
        .eq('market_code', market.code)
        .eq('is_active', true)
        .limit(8);

      console.log('📊 Query result:', { data, error, marketCode: market.code });

      if (error) throw error;
      
      // Cast the data to match our interface
      const typedData = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        image_url: item.image_url,
        price: item.price,
        original_price: item.original_price,
        currency: item.currency,
        shop: item.shop,
        rating: item.rating,
        review_count: item.review_count,
        availability: item.availability as 'in_stock' | 'out_of_stock' | 'limited',
        affiliate_links: Array.isArray(item.affiliate_links) 
          ? item.affiliate_links.map(link => ({
              affiliate_url: link.affiliate_url,
              tracking_code: link.tracking_code
            }))
          : []
      }));
      
      console.log('✅ Processed products:', typedData.length);
      setTopDeals(typedData);
    } catch (error) {
      console.error('❌ Error fetching top deals:', error);
      // Show empty array instead of mock data to avoid showing fake products
      setTopDeals([]);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <GoogleShoppingMeta 
        title="Najlepšie online nákupy na Slovensku - Porovnanie cien"
        description="Porovnajte ceny produktov z tisícov slovenských e-shopov. Nájdite najlepšie ponuky na elektroniku, módu, domov, zdravie a ďalšie kategórie."
        categories={categories}
      />
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative py-20 px-4 gradient-hero text-white">
          <div className="container mx-auto text-center">
            <h1 className="font-heading text-5xl md:text-6xl font-bold mb-6">
              Najlepšie online nákupy na Slovensku
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
              Porovnajte ceny a nájdite najlepšie ponuky z tisícov slovenských e-shopov
            </p>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
                Nákupné kategórie
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Preskúmajte naše hlavné kategórie produktov a nájdite presne to, čo hľadáte
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {categories.map((category) => (
                <CategoryCard
                  key={category.slug}
                  title={category.title}
                  slug={category.slug}
                  icon={category.icon}
                  productCount={category.productCount}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Top Deals Section */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
                {searchQuery ? `Výsledky vyhľadávania pre "${searchQuery}"` : 'Najlepšie ponuky'}
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                {searchQuery 
                  ? `Našli sme ${topDeals.length} produktov pre váš výber`
                  : 'Objavte najlepšie zľavy a akciové ponuky od overených predajcov'
                }
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                // Loading skeleton
                [...Array(4)].map((_, i) => (
                  <div key={i} className="bg-muted animate-pulse rounded-lg h-80"></div>
                ))
              ) : (
                topDeals.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              )}
            </div>

            <div className="text-center mt-8">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => {
                  navigate('/c/knihy-a-media');
                }}
              >
                Zobraziť všetky ponuky
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
