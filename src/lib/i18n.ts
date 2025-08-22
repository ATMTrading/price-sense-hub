export interface Market {
  id: string;
  code: 'SK' | 'PL';
  domain: string;
  currency: 'EUR' | 'PLN';
  locale: 'sk-SK' | 'pl-PL';
  flag: string;
}

export const MARKETS: Market[] = [
  {
    id: '1',
    code: 'SK',
    domain: 'pricecomparise.sk',
    currency: 'EUR',
    locale: 'sk-SK',
    flag: '🇸🇰'
  },
  {
    id: '2',
    code: 'PL',
    domain: 'pricecomparise.pl',
    currency: 'PLN',
    locale: 'pl-PL',
    flag: '🇵🇱'
  }
];

export const TRANSLATIONS = {
  SK: {
    'nav.home': 'Domov',
    'nav.categories': 'Kategórie',
    'nav.searchPlaceholder': 'Hľadať produkty…',
    'btn.viewOffer': 'Zobraziť ponuku',
    'btn.loadMore': 'Načítať viac',
    'filter.sortBy': 'Triediť podľa',
    'filter.priceRange': 'Cenové rozpätie',
    'filter.merchant': 'Obchod',
    'filter.availability': 'Dostupnosť',
    'msg.noResults': 'Žiadne výsledky',
    'hero.title': 'Najlepšie ceny na jednom mieste',
    'hero.subtitle': 'Porovnajte ceny z tisícov obchodov a ušetrite pri každom nákupe',
    'categories.title': 'Kategórie produktov',
    'categories.electronics': 'Elektronika',
    'categories.computers': 'Počítače a telefóny',
    'categories.homeElectronics': 'Domáce spotrebiče',
    'categories.health': 'Zdravie a krása',
    'categories.supplements': 'Výživové doplnky',
    'categories.children': 'Detské potreby',
    'categories.toys': 'Hračky a hry',
    'categories.sports': 'Šport a fitness',
    'topDeals.title': 'Najlepšie ponuky',
    'footer.legal': 'Právne informácie',
    'footer.contact': 'Kontakt',
    'footer.privacy': 'Ochrana súkromia'
  },
  PL: {
    'nav.home': 'Strona główna',
    'nav.categories': 'Kategorie',
    'nav.searchPlaceholder': 'Szukaj produktów…',
    'btn.viewOffer': 'Zobacz ofertę',
    'btn.loadMore': 'Załaduj więcej',
    'filter.sortBy': 'Sortuj według',
    'filter.priceRange': 'Przedział cenowy',
    'filter.merchant': 'Sklep',
    'filter.availability': 'Dostępność',
    'msg.noResults': 'Brak wyników',
    'hero.title': 'Najlepsze ceny w jednym miejscu',
    'hero.subtitle': 'Porównuj ceny z tysięcy sklepów i oszczędzaj przy każdym zakupie',
    'categories.title': 'Kategorie produktów',
    'categories.electronics': 'Elektronika',
    'categories.computers': 'Komputery i telefony',
    'categories.homeElectronics': 'Sprzęt AGD',
    'categories.health': 'Zdrowie i uroda',
    'categories.supplements': 'Suplementy diety',
    'categories.children': 'Artykuły dziecięce',
    'categories.toys': 'Zabawki i gry',
    'categories.sports': 'Sport i fitness',
    'topDeals.title': 'Najlepsze oferty',
    'footer.legal': 'Informacje prawne',
    'footer.contact': 'Kontakt',
    'footer.privacy': 'Polityka prywatności'
  }
} as const;

export function detectMarket(): Market {
  // In a real app, this would check the actual domain
  // For demo purposes, default to SK
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  if (hostname.includes('.pl')) {
    return MARKETS.find(m => m.code === 'PL')!;
  }
  
  return MARKETS.find(m => m.code === 'SK')!;
}

export function translate(key: keyof typeof TRANSLATIONS.SK, market: Market): string {
  return TRANSLATIONS[market.code][key] || key;
}

export function formatCurrency(amount: number, market: Market): string {
  return new Intl.NumberFormat(market.locale, {
    style: 'currency',
    currency: market.currency
  }).format(amount);
}

export function formatDate(date: Date, market: Market): string {
  return new Intl.DateTimeFormat(market.locale).format(date);
}