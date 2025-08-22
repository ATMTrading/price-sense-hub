import { useState, useEffect } from 'react';
import { detectMarket, type Market } from '@/lib/i18n';

export function useMarket() {
  const [market, setMarket] = useState<Market>(detectMarket);

  useEffect(() => {
    setMarket(detectMarket());
  }, []);

  return { market, setMarket };
}