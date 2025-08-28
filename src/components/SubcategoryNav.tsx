import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useMarket } from '@/hooks/useMarket';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
}

interface SubcategoryNavProps {
  parentCategory: Category;
}

export function SubcategoryNav({ parentCategory }: SubcategoryNavProps) {
  const { market } = useMarket();
  const { categorySlug } = useParams();
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubcategories();
  }, [parentCategory.id, market]);

  const fetchSubcategories = async () => {
    try {
      // Fetch subcategories for this parent category
      const { data: subcategoriesData, error } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_id', parentCategory.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      // Get product counts for each subcategory
      const subcategoriesWithCounts = await Promise.all(
        (subcategoriesData || []).map(async (subcategory) => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', subcategory.id)
            .eq('is_active', true);

          return {
            id: subcategory.id,
            name: subcategory.name,
            slug: subcategory.slug,
            productCount: count || 0
          };
        })
      );

      setSubcategories(subcategoriesWithCounts);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubcategories([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-32 mb-3"></div>
            <div className="flex flex-wrap gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-8 bg-muted rounded w-24"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (subcategories.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <h3 className="font-semibold mb-3 flex items-center">
          {parentCategory.name}
          <ChevronRight className="h-4 w-4 mx-2" />
          Subcategories
        </h3>
        <div className="flex flex-wrap gap-2">
          {/* All products in main category */}
          <Link to={`/c/${parentCategory.slug}`}>
            <Button 
              variant={categorySlug === parentCategory.slug ? "default" : "outline"}
              size="sm"
              className="text-sm"
            >
              All {parentCategory.name}
            </Button>
          </Link>
          
          {/* Subcategories */}
          {subcategories.map((subcategory) => (
            <Link key={subcategory.id} to={`/c/${subcategory.slug}`}>
              <Button 
                variant={categorySlug === subcategory.slug ? "default" : "outline"}
                size="sm"
                className="text-sm"
              >
                {subcategory.name}
                {subcategory.productCount !== undefined && (
                  <span className="ml-1 text-xs opacity-70">
                    ({subcategory.productCount})
                  </span>
                )}
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}