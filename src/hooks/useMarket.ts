import { useState, useEffect } from 'react';
import { detectMarket, type Market } from '@/lib/i18n';

export function useMarket() {
  const [market, setMarket] = useState<Market>(() => {
    // Try to get saved market from localStorage first
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selected-market');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // If parsing fails, fall back to Slovak market
        }
      }
    }
    // Default to Slovak market
    return {
      code: 'SK',
      name: 'Slovensko',
      currency: 'EUR',
      locale: 'sk-SK',
      flag: '🇸🇰'
    };
  });

  // Save market selection to localStorage when it changes
  const setMarketAndSave = (newMarket: Market) => {
    setMarket(newMarket);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selected-market', JSON.stringify(newMarket));
    }
  };

  return { market, setMarket: setMarketAndSave };
}