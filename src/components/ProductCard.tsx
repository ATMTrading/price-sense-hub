import { Star, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMarket } from '@/hooks/useMarket';
import { translate, formatCurrency } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  title: string;
  image_url: string;
  description?: string;
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

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className = '' }: ProductCardProps) {
  const { market } = useMarket();
  
  // Generate proper image URL for Restorio products
  const getImageUrl = (url: string) => {
    if (url.includes('restorio.sk') && !url.includes('/images/')) {
      // Extract ISBN from URL and construct proper image URL
      const isbn = url.split('/').pop();
      return `https://www.restorio.sk/images/big_${isbn}.jpg`;
    }
    return url;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.target as HTMLImageElement;
    if (img.src !== '/placeholder.svg') {
      img.src = '/placeholder.svg';
    }
  };

  const handleViewOffer = async () => {
    try {
      // Track the click via Supabase edge function
      const { data, error } = await supabase.functions.invoke('affiliate-track-click', {
        body: {
          productId: product.id,
          trackingCode: product.affiliate_links?.[0]?.tracking_code,
          referrer: window.location.href,
          userAgent: navigator.userAgent
        }
      });

      if (error) {
        console.error('❌ Tracking failed:', error);
      } else if (data?.success && data?.redirectUrl) {
        console.log('✅ Click tracked successfully:', data.trackingCode);
        window.open(data.redirectUrl, '_blank');
        return;
      }
      
      // Fallback - still open the link but without tracking
      if (product.affiliate_links && product.affiliate_links.length > 0) {
        window.open(product.affiliate_links[0].affiliate_url, '_blank');
      }
    } catch (error) {
      console.error('❌ Tracking error:', error);
      // Fallback - still open the link but without tracking
      if (product.affiliate_links && product.affiliate_links.length > 0) {
        window.open(product.affiliate_links[0].affiliate_url, '_blank');
      }
    }
  };


  return (
    <Card className={`group h-full transition-smooth hover:shadow-card-hover ${className}`}>
      <CardContent className="p-4">
        {/* Image */}
        <div className="aspect-square mb-4 overflow-hidden rounded-lg bg-muted/50 border">
          <img
            src={getImageUrl(product.image_url)}
            alt={product.title}
            className="h-full w-full object-cover transition-smooth group-hover:scale-105"
            loading="lazy"
            onError={handleImageError}
          />
        </div>

          {/* Content */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm line-clamp-2 leading-tight hover:text-primary transition-colors cursor-pointer">
            {product.title}
          </h3>

          {/* Description */}
          {product.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Price */}
          <div className="space-y-1">
            <span className="font-bold text-lg">
              {formatCurrency(product.price, market)}
            </span>
          </div>

          {/* Merchant */}
          <p className="text-xs text-muted-foreground">{product.shop.name}</p>

          {/* CTA Button */}
          <Button
            onClick={handleViewOffer}
            className="w-full"
            size="sm"
          >
            <ExternalLink className="h-3 w-3 mr-2" />
            {translate('btn.viewOffer', market)}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}