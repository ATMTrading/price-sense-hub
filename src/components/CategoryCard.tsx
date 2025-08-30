import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CategoryCardProps {
  id: string;
  name: string;
  slug: string;
  description?: string;
  product_count?: number;
  image_url?: string;
  Icon?: React.ComponentType<{ className?: string }>;
}

export function CategoryCard({ name, slug, description, product_count, image_url, Icon }: CategoryCardProps) {
  const navigate = useNavigate();

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden h-full"
      onClick={() => navigate(`/c/${slug}`)}
    >
      <div className="relative h-32 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
        {image_url ? (
          <img 
            src={image_url} 
            alt={name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : Icon ? (
          <Icon className="h-12 w-12 text-primary group-hover:scale-110 transition-transform duration-300" />
        ) : (
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">{name.charAt(0)}</span>
          </div>
        )}
      </div>
      
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
            {name}
          </h3>
          
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {description}
            </p>
          )}
          
          {product_count && (
            <Badge variant="secondary" className="text-xs">
              {product_count} produktov
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-end mt-2">
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </CardContent>
    </Card>
  );
}