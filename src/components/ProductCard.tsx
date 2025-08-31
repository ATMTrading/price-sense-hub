import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  original_price?: number;
  currency: string;
  image_url: string;
  availability: string;
  shop?: {
    id: string;
    name: string;
    logo_url?: string;
  };
  affiliate_links?: Array<{
    id: string;
    affiliate_url: string;
    tracking_code?: string;
  }>;
}

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className = '' }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Enhanced image URL handling for different restorio.sk domains
  const getImageUrl = (url: string): string => {
    if (!url) return '/placeholder.svg';
    
    // Handle different restorio.sk domains
    if (url.includes('restorio.sk')) {
      // Handle media.restorio.sk URLs - use them directly
      if (url.includes('media.restorio.sk')) {
        return url;
      }
      // Handle www.restorio.sk URLs
      return url.replace(/^https?:\/\/restorio\.sk/, 'https://www.restorio.sk');
    }
    
    return url;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    
    if (!imageError) {
      setImageError(true);
      // Try the original URL as fallback
      target.src = product.image_url;
    } else {
      // Final fallback to placeholder
      target.src = '/placeholder.svg';
    }
  };

  const handleViewOffer = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      console.log('Tracking click for product:', product.id);
      
      // Call the affiliate tracking function
      const { data, error } = await supabase.functions.invoke('affiliate-track-click', {
        body: {
          productId: product.id,
          referrer: window.location.href,
          userAgent: navigator.userAgent
        }
      });

      if (error) {
        console.error('Error tracking click:', error);
        // Fallback: open the shop URL directly
        if (product.shop?.name === 'Restorio.sk') {
          const fallbackUrl = `https://www.restorio.sk?utm_source=dognet&utm_medium=affiliate&utm_campaign=68b053b92fff1`;
          window.open(fallbackUrl, '_blank');
        }
        return;
      }

      console.log('Tracking response:', data);

      if (data?.redirectUrl) {
        console.log('Opening affiliate URL:', data.redirectUrl);
        window.open(data.redirectUrl, '_blank');
      } else {
        console.warn('No redirect URL received');
      }
    } catch (error) {
      console.error('Error in handleViewOffer:', error);
      // Fallback for any unexpected errors
      if (product.shop?.name === 'Restorio.sk') {
        const fallbackUrl = `https://www.restorio.sk?utm_source=dognet&utm_medium=affiliate&utm_campaign=68b053b92fff1`;
        window.open(fallbackUrl, '_blank');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('sk-SK', {
      style: 'currency',
      currency: currency || 'EUR'
    }).format(price);
  };

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 overflow-hidden h-full ${className}`}>
      <div className="relative overflow-hidden">
        <img
          src={getImageUrl(product.image_url)}
          alt={product.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={handleImageError}
          loading="lazy"
        />
        {product.original_price && product.original_price > product.price && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white">
            -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
          </Badge>
        )}
        <Badge 
          className={`absolute top-2 right-2 ${
            product.availability === 'in stock' 
              ? 'bg-green-500 text-white' 
              : 'bg-orange-500 text-white'
          }`}
        >
          {product.availability === 'in stock' ? 'Skladom' : 'Na objednávku'}
        </Badge>
      </div>
      
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex-1">
          <h3 className="font-semibold text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
            {product.title}
          </h3>
          
          {product.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {product.description}
            </p>
          )}

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">
                {formatPrice(product.price, product.currency)}
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.original_price, product.currency)}
                </span>
              )}
            </div>


            {product.shop && (
              <div className="text-xs text-muted-foreground">
                {product.shop.name}
              </div>
            )}
          </div>
        </div>

        <Button 
          onClick={handleViewOffer}
          disabled={isLoading}
          className="w-full mt-auto"
          size="sm"
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          {isLoading ? 'Načítavam...' : 'Zobraziť ponuku'}
        </Button>
      </CardContent>
    </Card>
  );
}