import { useState, useEffect } from 'react';
import { Home, Shirt, Heart, Baby, Dumbbell, Cpu, Search } from 'lucide-react';
import { Header } from '@/components/Layout/Header';
import { Footer } from '@/components/Layout/Footer';
import { CategoryCard } from '@/components/CategoryCard';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMarket } from '@/hooks/useMarket';
import { translate } from '@/lib/i18n';
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
  availability: 'in_stock' | 'out_of_stock' | 'limited';
  affiliate_links?: Array<{
    affiliate_url: string;
    tracking_code?: string;
  }>;
}

const Index = () => {
  const { market } = useMarket();
  const [topDeals, setTopDeals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchTopDeals();
    fetchCategories();
  }, [market]);

  const fetchCategories = async () => {
    try {
      // Fetch all categories with product counts
      const { data: categoriesData, error } = await supabase
        .from('categories')
        .select('*')
        .eq('market_code', market.code)
        .eq('is_active', true);

      if (error) throw error;

      // Get product counts for each category
      const categoriesWithCounts = await Promise.all(
        (categoriesData || []).map(async (category) => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
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
          slug: 'electronics',
          icon: Cpu,
          productCount: 0
        },
        {
          title: 'Divat és Ruházat',
          slug: 'fashion',
          icon: Shirt,
          productCount: 0
        },
        {
          title: 'Egészség és Szépség',
          slug: 'health-beauty',
          icon: Heart,
          productCount: 0
        },
        {
          title: 'Otthon és Kert',
          slug: 'home-garden',
          icon: Home,
          productCount: 0
        },
        {
          title: 'Sport és Szabadidő',
          slug: 'sports',
          icon: Dumbbell,
          productCount: 0
        },
        {
          title: 'Gyermek és Baba',
          slug: 'baby-kids',
          icon: Baby,
          productCount: 0
        }
      ]);
    }
  };

  const getIconForCategory = (slug: string) => {
    const iconMap: { [key: string]: any } = {
      electronics: Cpu,
      elektronika: Cpu,
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

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    console.log('🔍 Searching for:', searchTerm);
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
        .ilike('title', `%${searchTerm}%`)
        .limit(4);

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

      console.log('🔍 Search results:', searchResults.length);
      setTopDeals(searchResults);
    } catch (error) {
      console.error('❌ Search error:', error);
    }
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
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative py-20 px-4 gradient-hero text-white">
          <div className="container mx-auto text-center">
            <h1 className="font-heading text-5xl md:text-6xl font-bold mb-6">
              {translate('hero.title', market)}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
              {translate('hero.subtitle', market)}
            </p>
            
            {/* Hero Search */}
            <div className="max-w-2xl mx-auto">
              <form onSubmit={(e) => {
                e.preventDefault();
                const searchTerm = (e.currentTarget.search as HTMLInputElement).value;
                handleSearch(searchTerm);
              }}>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/70" />
                  <Input
                    name="search"
                    type="search"
                    placeholder={translate('nav.searchPlaceholder', market)}
                    className="pl-12 py-4 text-lg bg-white/10 border-white/20 text-white placeholder:text-white/70 focus:bg-white/20"
                  />
                  <Button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white text-primary hover:bg-white/90">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
                {translate('categories.title', market)}
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Browse through our carefully selected categories to find the best deals
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
                {translate('topDeals.title', market)}
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Don't miss these limited-time offers from top merchants
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
                  console.log('Navigate to all deals page');
                  // TODO: Navigate to deals page
                }}
              >
                View All Deals
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
