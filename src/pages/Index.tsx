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
    id: string;
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
              id: link.id,
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
                  id: link.id,
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
      console.log('Fetching main categories for market:', market.code);
      
      // First get main categories (no parent_id)
      const { data: mainCategories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('market_code', market.code)
        .eq('is_active', true)
        .is('parent_id', null);

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        return;
      }

      console.log('Main categories:', mainCategories);

      // Get product counts for each main category (including subcategories)
      const categoriesWithCounts = await Promise.all(
        mainCategories.map(async (category) => {
          // Get subcategories
          const { data: subcategories } = await supabase
            .from('categories')
            .select('id')
            .eq('parent_id', category.id)
            .eq('is_active', true);

          // Get all category IDs (main + subcategories)
          const categoryIds = [category.id, ...(subcategories?.map(sub => sub.id) || [])];

          // Count products in all these categories
          const { count } = await supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .in('category_id', categoryIds)
            .eq('is_active', true)
            .eq('market_code', market.code);

          return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description || `Nájdite tie najlepšie produkty v kategórii ${category.name}`,
            product_count: count || 0,
            icon: getIconForCategory(category.slug)
          };
        })
      );

      console.log('Categories with counts:', categoriesWithCounts);
      // Show categories with product count > 0, but also show a few with 0 for better UX
      const categoriesWithProducts = categoriesWithCounts.filter(cat => cat.product_count > 0);
      const categoriesWithoutProducts = categoriesWithCounts.filter(cat => cat.product_count === 0).slice(0, 2);
      setCategories([...categoriesWithProducts, ...categoriesWithoutProducts]);
    } catch (error) {
      console.error('Error in fetchCategories:', error);
      // Fallback to mock data
      setCategories([
        { id: '1', name: 'Knihy a Médiá', slug: 'knihy-a-media', description: 'Široký výber kníh, časopisov, e-kníh a multimediálneho obsahu pre všetky vekové kategórie.', product_count: 125, icon: Cpu },
        { id: '2', name: 'Elektronika a Technika', slug: 'elektronika-technika', description: 'Najnovšie technológie, počítače, mobilné telefóny a elektronické zariadenia.', product_count: 89, icon: Cpu },
        { id: '3', name: 'Móda a Štýl', slug: 'moda-styl', description: 'Trendy oblečenie, obuv, doplnky a módne akcesóriá pre dámy a pánov.', product_count: 156, icon: Shirt },
        { id: '4', name: 'Domov a Záhrada', slug: 'domov-zahrada', description: 'Všetko pre váš domov, záhradu, dekorácie a domáce spotrebiče.', product_count: 78, icon: Home },
        { id: '5', name: 'Šport a Voľný čas', slug: 'sport-volny-cas', description: 'Športové potreby, fitness vybavenie a aktivity pre voľný čas.', product_count: 95, icon: Dumbbell },
        { id: '6', name: 'Zdravie a Krása', slug: 'zdravie-krasa', description: 'Kozmetika, parfumy, vitamíny a produkty pre zdravie a krásu.', product_count: 67, icon: Heart },
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
              id: link.id,
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
                  id={category.id}
                  name={category.name}
                  slug={category.slug}
                  description={category.description}
                  product_count={category.product_count}
                  Icon={category.icon}
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
