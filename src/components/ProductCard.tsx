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

  const savings = product.original_price ? product.original_price - product.price : 0;
  const savingsPercent = product.original_price 
    ? Math.round((savings / product.original_price) * 100)
    : 0;

  return (
    <Card className={`group h-full transition-smooth hover:shadow-card-hover ${className}`}>
      <CardContent className="p-4">
        {/* Image */}
        <div className="aspect-square mb-4 overflow-hidden rounded-lg bg-muted">
          <img
            src={product.image_url}
            alt={product.title}
            className="h-full w-full object-cover transition-smooth group-hover:scale-105"
            loading="lazy"
          />
        </div>

          {/* Content */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm line-clamp-2 leading-tight">
            {product.title}
          </h3>

          {/* Price */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg">
                {formatCurrency(product.price, market)}
              </span>
              {product.original_price && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatCurrency(product.original_price, market)}
                </span>
              )}
            </div>
            {savings > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-success text-success-foreground px-2 py-1 rounded-full">
                  -{savingsPercent}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {translate('product.save', market)} {formatCurrency(savings, market)}
                </span>
              </div>
            )}
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