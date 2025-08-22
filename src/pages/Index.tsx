import { Smartphone, Laptop, Heart, Baby, Dumbbell, Zap, Search } from 'lucide-react';
import { Header } from '@/components/Layout/Header';
import { Footer } from '@/components/Layout/Footer';
import { CategoryCard } from '@/components/CategoryCard';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMarket } from '@/hooks/useMarket';
import { translate } from '@/lib/i18n';

const Index = () => {
  const { market } = useMarket();

  // Mock data for demonstration
  const categories = [
    {
      title: translate('categories.electronics', market),
      slug: 'electronics',
      icon: Zap,
      productCount: 15420
    },
    {
      title: translate('categories.computers', market),
      slug: 'computers',
      icon: Laptop,
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
      title: 'Smartphones',
      slug: 'smartphones',
      icon: Smartphone,
      productCount: 2890
    }
  ];

  const topDeals = [
    {
      id: '1',
      title: 'Samsung Galaxy S24 Ultra 256GB',
      imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop',
      price: 1199,
      originalPrice: 1399,
      merchant: 'TechStore',
      rating: 4.8,
      reviewCount: 234,
      availability: 'in-stock' as const
    },
    {
      id: '2',
      title: 'Apple MacBook Pro 14" M3',
      imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop',
      price: 1999,
      originalPrice: 2199,
      merchant: 'AppleStore',
      rating: 4.9,
      reviewCount: 156,
      availability: 'limited' as const
    },
    {
      id: '3',
      title: 'Sony WH-1000XM5 Headphones',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
      price: 299,
      originalPrice: 399,
      merchant: 'AudioPro',
      rating: 4.7,
      reviewCount: 89,
      availability: 'in-stock' as const
    },
    {
      id: '4',
      title: 'Nintendo Switch OLED',
      imageUrl: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=300&h=300&fit=crop',
      price: 349,
      merchant: 'GameWorld',
      rating: 4.6,
      reviewCount: 201,
      availability: 'in-stock' as const
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
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/70" />
                <Input
                  type="search"
                  placeholder={translate('nav.searchPlaceholder', market)}
                  className="pl-12 py-4 text-lg bg-white/10 border-white/20 text-white placeholder:text-white/70 focus:bg-white/20"
                />
                <Button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white text-primary hover:bg-white/90">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
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
              {topDeals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="text-center mt-8">
              <Button variant="outline" size="lg">
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
