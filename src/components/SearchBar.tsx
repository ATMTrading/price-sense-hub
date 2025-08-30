import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMarket } from '@/hooks/useMarket';

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
  const { market } = useMarket();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleSearch(query.trim());
    }
  };

  const handleSearch = (searchQuery: string) => {
    // Dispatch custom event for other pages to listen
    window.dispatchEvent(new CustomEvent('headerSearch', { 
      detail: { query: searchQuery } 
    }));
    
    onSearch(searchQuery);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className={`relative flex items-center ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || 'Hľadať produkty...'}
          className="pl-10 pr-10"
        />
        {query && showClearButton && (
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={handleClear} 
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-auto p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Button type="submit" className="ml-2">
        Hľadať
      </Button>
    </form>
  );
}