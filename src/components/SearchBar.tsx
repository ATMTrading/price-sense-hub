import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMarket } from '@/hooks/useMarket';
import { translate } from '@/lib/i18n';
interface SearchBarProps {
  onSearch: (query: string) => void;
  className?: string;
  placeholder?: string;
  showClearButton?: boolean;
}
export function SearchBar({
  onSearch,
  className = '',
  placeholder,
  showClearButton = true
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const {
    market
  } = useMarket();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };
  const handleClear = () => {
    setQuery('');
    onSearch('');
  };
  return <form onSubmit={handleSubmit} className={`relative flex items-center ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        
        {query && showClearButton && <Button type="button" variant="ghost" size="sm" onClick={handleClear} className="absolute right-1 top-1/2 transform -translate-y-1/2 h-auto p-1 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </Button>}
      </div>
      
      
    </form>;
}