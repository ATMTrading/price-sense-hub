import { Star, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMarket } from '@/hooks/useMarket';
import { translate, formatCurrency } from '@/lib/i18n';

interface Product {
  id: string;
  title: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  merchant: string;
  rating?: number;
  reviewCount?: number;
  availability: 'in-stock' | 'out-of-stock' | 'limited';
}

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className = '' }: ProductCardProps) {
  const { market } = useMarket();

  const handleViewOffer = () => {
    // TODO: Implement click tracking
    console.log('Track click:', product.id);
  };

  const savings = product.originalPrice ? product.originalPrice - product.price : 0;
  const savingsPercent = product.originalPrice 
    ? Math.round((savings / product.originalPrice) * 100)
    : 0;

  return (
    <Card className={`group h-full transition-smooth hover:shadow-card-hover ${className}`}>
      <CardContent className="p-4">
        {/* Image */}
        <div className="aspect-square mb-4 overflow-hidden rounded-lg bg-muted">
          <img
            src={product.imageUrl}
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

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center space-x-1">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.floor(product.rating!)
                        ? 'text-yellow-400 fill-current'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              {product.reviewCount && (
                <span className="text-xs text-muted-foreground">
                  ({product.reviewCount})
                </span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg">
                {formatCurrency(product.price, market)}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatCurrency(product.originalPrice, market)}
                </span>
              )}
            </div>
            {savings > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-success text-success-foreground px-2 py-1 rounded-full">
                  -{savingsPercent}%
                </span>
                <span className="text-xs text-muted-foreground">
                  Save {formatCurrency(savings, market)}
                </span>
              </div>
            )}
          </div>

          {/* Merchant */}
          <p className="text-xs text-muted-foreground">{product.merchant}</p>

          {/* Availability */}
          <div className="flex items-center space-x-2">
            <div
              className={`h-2 w-2 rounded-full ${
                product.availability === 'in-stock'
                  ? 'bg-success'
                  : product.availability === 'limited'
                  ? 'bg-warning'
                  : 'bg-destructive'
              }`}
            />
            <span className="text-xs text-muted-foreground">
              {product.availability === 'in-stock'
                ? 'In Stock'
                : product.availability === 'limited'
                ? 'Limited Stock'
                : 'Out of Stock'}
            </span>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleViewOffer}
            disabled={product.availability === 'out-of-stock'}
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