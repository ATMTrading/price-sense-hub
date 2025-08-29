// Performance optimization utilities for the import system

export const createVirtualizedList = () => {
  // Virtual scrolling implementation for large category lists
  const ITEM_HEIGHT = 60;
  const CONTAINER_HEIGHT = 300;
  
  return {
    itemHeight: ITEM_HEIGHT,
    containerHeight: CONTAINER_HEIGHT,
    visibleItems: Math.ceil(CONTAINER_HEIGHT / ITEM_HEIGHT) + 2
  };
};

export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout;
  
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
};

export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  limit: number
): T => {
  let inThrottle: boolean;
  
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
};

export const memoizeCategories = () => {
  const cache = new Map();
  
  return {
    get: (key: string) => cache.get(key),
    set: (key: string, value: any) => {
      cache.set(key, value);
      
      // Limit cache size to prevent memory leaks
      if (cache.size > 100) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
    },
    clear: () => cache.clear()
  };
};

export const batchProcessItems = async <T, R>(
  items: T[],
  processor: (batch: T[]) => Promise<R[]>,
  batchSize: number = 10,
  onProgress?: (processed: number, total: number) => void
): Promise<R[]> => {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
    
    if (onProgress) {
      onProgress(Math.min(i + batchSize, items.length), items.length);
    }
    
    // Small delay to prevent overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  return results;
};

export const createLoadingStates = () => ({
  skeleton: (count: number) => Array.from({ length: count }, (_, i) => ({
    id: `skeleton-${i}`,
    loading: true
  })),
  
  shimmer: 'animate-pulse bg-gradient-to-r from-muted via-muted-foreground/10 to-muted',
  
  spinner: 'animate-spin',
  
  fadeIn: 'animate-fade-in',
  
  slideIn: 'animate-slide-in-right'
});

export const optimizeReactRendering = () => ({
  shouldComponentUpdate: (prevProps: any, nextProps: any) => {
    // Shallow comparison for props
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);
    
    if (prevKeys.length !== nextKeys.length) return true;
    
    return prevKeys.some(key => prevProps[key] !== nextProps[key]);
  },
  
  memoizedCallback: <T extends (...args: any[]) => any>(callback: T, deps: any[]): T => {
    // This would typically be used with React.useCallback
    return callback;
  }
});