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

  useEffect(() => {
    fetchTopDeals();
  }, [market]);

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
        .eq('is_featured', true)
        .limit(4);

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
      // Fallback to mock data
      console.log('🔄 Using fallback mock data');
      setTopDeals([
        {
          id: '1',
          title: 'Samsung Galaxy S24 Ultra 256GB',
          image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop',
          price: 1199,
          original_price: 1399,
          currency: market.currency,
          shop: { id: '1', name: 'TechStore' },
          rating: 4.8,
          review_count: 234,
          availability: 'in_stock',
          affiliate_links: [{ affiliate_url: '#', tracking_code: 'demo' }]
        },
        {
          id: '2',
          title: 'Apple MacBook Pro 14" M3',
          image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop',
          price: 1999,
          original_price: 2199,
          currency: market.currency,
          shop: { id: '2', name: 'AppleStore' },
          rating: 4.9,
          review_count: 156,
          availability: 'limited',
          affiliate_links: [{ affiliate_url: '#', tracking_code: 'demo' }]
        },
        {
          id: '3',
          title: 'Sony WH-1000XM5 Headphones',
          image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
          price: 299,
          original_price: 399,
          currency: market.currency,
          shop: { id: '3', name: 'AudioPro' },
          rating: 4.7,
          review_count: 89,
          availability: 'in_stock',
          affiliate_links: [{ affiliate_url: '#', tracking_code: 'demo' }]
        },
        {
          id: '4',
          title: 'Nintendo Switch OLED',
          image_url: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=300&h=300&fit=crop',
          price: 349,
          currency: market.currency,
          shop: { id: '4', name: 'GameWorld' },
          rating: 4.6,
          review_count: 201,
          availability: 'in_stock',
          affiliate_links: [{ affiliate_url: '#', tracking_code: 'demo' }]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for demonstration
  const categories = [
    {
      title: translate('categories.electronics', market),
      slug: 'electronics',
      icon: Cpu,
      productCount: 15420
    },
    {
      title: translate('categories.fashion', market),
      slug: 'fashion',
      icon: Shirt,
      productCount: 8930
    },
    {
      title: translate('categories.health', market),
      slug: 'health',
      icon: Heart,
      productCount: 5670
    },
    {
      title: translate('categories.children', market),
      slug: 'children',
      icon: Baby,
      productCount: 3280
    },
    {
      title: translate('categories.sports', market),
      slug: 'sports',
      icon: Dumbbell,
      productCount: 4150
    },
    {
      title: translate('categories.homeLiving', market),
      slug: 'home-living',
      icon: Home,
      productCount: 2890
    }
  ];

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
                console.log('Search:', searchTerm);
                // TODO: Implement search functionality
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
