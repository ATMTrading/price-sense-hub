import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMarket } from '@/hooks/useMarket';
import { translate } from '@/lib/i18n';

interface CategoryCardProps {
  title: string;
  slug: string;
  icon: LucideIcon;
  productCount?: number;
  className?: string;
}

export function CategoryCard({ title, slug, icon: Icon, productCount, className = '' }: CategoryCardProps) {
  const { market } = useMarket();
  
  return (
    <Link to={`/c/${slug}`} className={`block group ${className}`}>
      <Card className="h-full transition-smooth hover:shadow-card-hover hover:scale-[1.02] gradient-card border-0">
        <CardContent className="p-6 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-smooth">
            <Icon className="h-6 w-6 text-primary group-hover:text-white transition-smooth" />
          </div>
          <h3 className="font-heading text-lg font-semibold mb-2">{title}</h3>
          {productCount !== undefined && (
            <p className="text-sm text-muted-foreground">
              {productCount.toLocaleString()} {translate('product.products', market)}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}