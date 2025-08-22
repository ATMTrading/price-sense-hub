import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, Grid, List } from 'lucide-react';
import { Header } from '@/components/Layout/Header';
import { Footer } from '@/components/Layout/Footer';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMarket } from '@/hooks/useMarket';
import { translate, formatCurrency } from '@/lib/i18n';

export default function CategoryListing() {
  const { categorySlug } = useParams();
  const { market } = useMarket();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [selectedMerchants, setSelectedMerchants] = useState<string[]>([]);

  // Mock data
  const products = Array.from({ length: 20 }, (_, i) => ({
    id: `product-${i + 1}`,
    title: `Premium Product ${i + 1} - High Quality Electronics`,
    imageUrl: `https://images.unsplash.com/photo-${1500000000000 + i * 100000}?w=300&h=300&fit=crop`,
    price: Math.floor(Math.random() * 1500) + 100,
    originalPrice: Math.random() > 0.6 ? Math.floor(Math.random() * 1500) + 200 : undefined,
    merchant: ['TechStore', 'ElectroWorld', 'DigitalHub', 'GadgetPlus'][Math.floor(Math.random() * 4)],
    rating: Math.random() * 2 + 3,
    reviewCount: Math.floor(Math.random() * 500) + 10,
    availability: (['in-stock', 'limited', 'out-of-stock'] as const)[Math.floor(Math.random() * 3)]
  }));

  const merchants = ['TechStore', 'ElectroWorld', 'DigitalHub', 'GadgetPlus'];
  
  const categoryNames: Record<string, { sk: string; pl: string }> = {
    'electronics': { sk: 'Elektronika', pl: 'Elektronika' },
    'computers': { sk: 'Počítače a telefóny', pl: 'Komputery i telefony' },
    'health': { sk: 'Zdravie a krása', pl: 'Zdrowie i uroda' },
    'children': { sk: 'Detské potreby', pl: 'Artykuły dziecięce' },
    'sports': { sk: 'Šport a fitness', pl: 'Sport i fitness' }
  };

  const categoryName = categoryNames[categorySlug || 'electronics']?.[market.code.toLowerCase() as 'sk' | 'pl'] || 'Category';

  const toggleMerchant = (merchant: string) => {
    setSelectedMerchants(prev =>
      prev.includes(merchant)
        ? prev.filter(m => m !== merchant)
        : [...prev, merchant]
    );
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
            <span>/</span>
            <span className="text-foreground">{categoryName}</span>
          </div>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold mb-2">{categoryName}</h1>
            <p className="text-muted-foreground">{products.length} products found</p>
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
            <Select defaultValue="relevance">
              <SelectTrigger className="w-48">
                <SelectValue placeholder={translate('filter.sortBy', market)} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
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
                  Filters
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
                      <Checkbox id="in-stock" defaultChecked />
                      <label htmlFor="in-stock" className="text-sm font-medium">
                        In Stock
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="limited-stock" />
                      <label htmlFor="limited-stock" className="text-sm font-medium">
                        Limited Stock
                      </label>
                    </div>
                  </div>
                </div>

                <Button className="w-full" variant="outline">
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
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
              <Button size="lg" variant="outline">
                {translate('btn.loadMore', market)}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}