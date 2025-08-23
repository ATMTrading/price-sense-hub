export interface Market {
  id: string;
  code: 'SK' | 'PL' | 'HU' | 'CZ' | 'RO';
  domain: string;
  currency: 'EUR' | 'PLN' | 'HUF' | 'CZK' | 'RON';
  locale: 'sk-SK' | 'pl-PL' | 'hu-HU' | 'cs-CZ' | 'ro-RO';
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
  },
  {
    id: '3',
    code: 'HU',
    domain: 'pricecomparise.hu',
    currency: 'HUF',
    locale: 'hu-HU',
    flag: '🇭🇺'
  },
  {
    id: '4',
    code: 'CZ',
    domain: 'pricecomparise.cz',
    currency: 'CZK',
    locale: 'cs-CZ',
    flag: '🇨🇿'
  },
  {
    id: '5',
    code: 'RO',
    domain: 'pricecomparise.ro',
    currency: 'RON',
    locale: 'ro-RO',
    flag: '🇷🇴'
  }
];

export const TRANSLATIONS = {
  SK: {
    'nav.home': 'Domov',
    'nav.categories': 'Kategórie',
    'nav.searchPlaceholder': 'Hľadať produkty…',
    'btn.viewOffer': 'Zobraziť ponuku',
    'btn.loadMore': 'Načítať viac',
    'btn.clearFilters': 'Vymazať filtre',
    'filter.sortBy': 'Triediť podľa',
    'filter.priceRange': 'Cenové rozpätie',
    'filter.merchant': 'Obchod',
    'filter.availability': 'Dostupnosť',
    'filter.filters': 'Filtre',
    'sort.relevance': 'Relevancia',
    'sort.priceLow': 'Cena: Od najnižšej',
    'sort.priceHigh': 'Cena: Od najvyššej',
    'sort.newest': 'Najnovšie',
    'sort.rating': 'Najlepšie hodnotené',
    'availability.inStock': 'Skladom',
    'availability.limitedStock': 'Obmedzené množstvo',
    'availability.outOfStock': 'Nedostupné',
    'product.save': 'Ušetríte',
    'product.products': 'produktov',
    'product.productsFound': 'produktov nájdených',
    'msg.noResults': 'Žiadne výsledky',
    'hero.title': 'Najlepšie ceny na jednom mieste',
    'hero.subtitle': 'Porovnajte ceny z tisícov obchodov a ušetrite pri každom nákupe',
    'categories.title': 'Kategórie produktov',
    'categories.electronics': 'Elektronika a príslušenstvo',
    'categories.fashion': 'Móda',
    'categories.homeLiving': 'Domov a bývanie',
    'categories.homeElectronics': 'Domáce spotrebiče',
    'categories.health': 'Zdravie a krása',
    'categories.supplements': 'Výživové doplnky',
    'categories.children': 'Detské potreby',
    'categories.toys': 'Hračky a hry',
    'categories.sports': 'Šport a fitness',
    'topDeals.title': 'Najlepšie ponuky',
    'footer.legal': 'Právne informácie',
    'footer.contact': 'Kontakt',
    'footer.privacy': 'Ochrana súkromia',
    'footer.market': 'Trh',
    'footer.currency': 'Mena',
    'footer.copyright': '© 2024 PriceComparise. Všetky práva vyhradené.'
  },
  PL: {
    'nav.home': 'Strona główna',
    'nav.categories': 'Kategorie',
    'nav.searchPlaceholder': 'Szukaj produktów…',
    'btn.viewOffer': 'Zobacz ofertę',
    'btn.loadMore': 'Załaduj więcej',
    'btn.clearFilters': 'Wyczyść filtry',
    'filter.sortBy': 'Sortuj według',
    'filter.priceRange': 'Przedział cenowy',
    'filter.merchant': 'Sklep',
    'filter.availability': 'Dostępność',
    'filter.filters': 'Filtry',
    'sort.relevance': 'Trafność',
    'sort.priceLow': 'Cena: Od najniższej',
    'sort.priceHigh': 'Cena: Od najwyższej',
    'sort.newest': 'Najnowsze',
    'sort.rating': 'Najlepiej oceniane',
    'availability.inStock': 'Dostępny',
    'availability.limitedStock': 'Ograniczona dostępność',
    'availability.outOfStock': 'Niedostępny',
    'product.save': 'Oszczędzasz',
    'product.products': 'produktów',
    'product.productsFound': 'produktów znalezionych',
    'msg.noResults': 'Brak wyników',
    'hero.title': 'Najlepsze ceny w jednym miejscu',
    'hero.subtitle': 'Porównuj ceny z tysięcy sklepów i oszczędzaj przy każdym zakupie',
    'categories.title': 'Kategorie produktów',
    'categories.electronics': 'Elektronika i akcesoria',
    'categories.fashion': 'Moda',
    'categories.homeLiving': 'Dom i życie',
    'categories.homeElectronics': 'Sprzęt AGD',
    'categories.health': 'Zdrowie i uroda',
    'categories.supplements': 'Suplementy diety',
    'categories.children': 'Artykuły dziecięce',
    'categories.toys': 'Zabawki i gry',
    'categories.sports': 'Sport i fitness',
    'topDeals.title': 'Najlepsze oferty',
    'footer.legal': 'Informacje prawne',
    'footer.contact': 'Kontakt',
    'footer.privacy': 'Polityka prywatności',
    'footer.market': 'Rynek',
    'footer.currency': 'Waluta',
    'footer.copyright': '© 2024 PriceComparise. Wszelkie prawa zastrzeżone.'
  },
  HU: {
    'nav.home': 'Főoldal',
    'nav.categories': 'Kategóriák',
    'nav.searchPlaceholder': 'Termékek keresése…',
    'btn.viewOffer': 'Ajánlat megtekintése',
    'btn.loadMore': 'Továbbiak betöltése',
    'btn.clearFilters': 'Szűrők törlése',
    'filter.sortBy': 'Rendezés',
    'filter.priceRange': 'Ártartomány',
    'filter.merchant': 'Kereskedő',
    'filter.availability': 'Elérhetőség',
    'filter.filters': 'Szűrők',
    'sort.relevance': 'Relevancia',
    'sort.priceLow': 'Ár: Alacsony - Magas',
    'sort.priceHigh': 'Ár: Magas - Alacsony',
    'sort.newest': 'Legújabb',
    'sort.rating': 'Legjobb értékelés',
    'availability.inStock': 'Raktáron',
    'availability.limitedStock': 'Korlátozott készlet',
    'availability.outOfStock': 'Elfogyott',
    'product.save': 'Megtakarítás',
    'product.products': 'termék',
    'product.productsFound': 'termék találat',
    'msg.noResults': 'Nincs találat',
    'hero.title': 'A legjobb árak egy helyen',
    'hero.subtitle': 'Hasonlítsd össze az árakat több ezer boltból és spórolj minden vásárlásnál',
    'categories.title': 'Termékkategóriák',
    'categories.electronics': 'Elektronika és kiegészítők',
    'categories.fashion': 'Divat',
    'categories.homeLiving': 'Otthon és élet',
    'categories.homeElectronics': 'Háztartási gépek',
    'categories.health': 'Egészség és szépség',
    'categories.supplements': 'Táplálékkiegészítők',
    'categories.children': 'Gyermekáruk',
    'categories.toys': 'Játékok és játékok',
    'categories.sports': 'Sport és fitness',
    'topDeals.title': 'Legjobb ajánlatok',
    'footer.legal': 'Jogi információk',
    'footer.contact': 'Kapcsolat',
    'footer.privacy': 'Adatvédelem',
    'footer.market': 'Piac',
    'footer.currency': 'Pénznem',
    'footer.copyright': '© 2024 PriceComparise. Minden jog fenntartva.'
  },
  CZ: {
    'nav.home': 'Domů',
    'nav.categories': 'Kategorie',
    'nav.searchPlaceholder': 'Hledat produkty…',
    'btn.viewOffer': 'Zobrazit nabídku',
    'btn.loadMore': 'Načíst více',
    'btn.clearFilters': 'Vymazat filtry',
    'filter.sortBy': 'Seřadit podle',
    'filter.priceRange': 'Cenové rozpětí',
    'filter.merchant': 'Obchod',
    'filter.availability': 'Dostupnost',
    'filter.filters': 'Filtry',
    'sort.relevance': 'Relevance',
    'sort.priceLow': 'Cena: Od nejnižší',
    'sort.priceHigh': 'Cena: Od nejvyšší',
    'sort.newest': 'Nejnovější',
    'sort.rating': 'Nejlépe hodnocené',
    'availability.inStock': 'Skladem',
    'availability.limitedStock': 'Omezené množství',
    'availability.outOfStock': 'Není skladem',
    'product.save': 'Ušetříte',
    'product.products': 'produktů',
    'product.productsFound': 'produktů nalezeno',
    'msg.noResults': 'Žádné výsledky',
    'hero.title': 'Nejlepší ceny na jednom místě',
    'hero.subtitle': 'Porovnejte ceny z tisíců obchodů a ušetřete při každém nákupu',
    'categories.title': 'Kategorie produktů',
    'categories.electronics': 'Elektronika a příslušenství',
    'categories.fashion': 'Móda',
    'categories.homeLiving': 'Domov a bydlení',
    'categories.homeElectronics': 'Domácí spotřebiče',
    'categories.health': 'Zdraví a krása',
    'categories.supplements': 'Výživové doplňky',
    'categories.children': 'Dětské potřeby',
    'categories.toys': 'Hračky a hry',
    'categories.sports': 'Sport a fitness',
    'topDeals.title': 'Nejlepší nabídky',
    'footer.legal': 'Právní informace',
    'footer.contact': 'Kontakt',
    'footer.privacy': 'Ochrana soukromí',
    'footer.market': 'Trh',
    'footer.currency': 'Měna',
    'footer.copyright': '© 2024 PriceComparise. Všechna práva vyhrazena.'
  },
  RO: {
    'nav.home': 'Acasă',
    'nav.categories': 'Categorii',
    'nav.searchPlaceholder': 'Căutați produse…',
    'btn.viewOffer': 'Vezi oferta',
    'btn.loadMore': 'Încarcă mai mult',
    'btn.clearFilters': 'Șterge filtrele',
    'filter.sortBy': 'Sortează după',
    'filter.priceRange': 'Interval de preț',
    'filter.merchant': 'Magazin',
    'filter.availability': 'Disponibilitate',
    'filter.filters': 'Filtre',
    'sort.relevance': 'Relevanță',
    'sort.priceLow': 'Preț: De la mic la mare',
    'sort.priceHigh': 'Preț: De la mare la mic',
    'sort.newest': 'Cele mai noi',
    'sort.rating': 'Cel mai bine cotate',
    'availability.inStock': 'În stoc',
    'availability.limitedStock': 'Stoc limitat',
    'availability.outOfStock': 'Epuizat',
    'product.save': 'Economisiți',
    'product.products': 'produse',
    'product.productsFound': 'produse găsite',
    'msg.noResults': 'Niciun rezultat',
    'hero.title': 'Cele mai bune prețuri într-un singur loc',
    'hero.subtitle': 'Comparați prețurile din mii de magazine și economisiți la fiecare cumpărătură',
    'categories.title': 'Categorii de produse',
    'categories.electronics': 'Electronică și accesorii',
    'categories.fashion': 'Modă',
    'categories.homeLiving': 'Casă și viață',
    'categories.homeElectronics': 'Electrocasnice',
    'categories.health': 'Sănătate și frumusețe',
    'categories.supplements': 'Suplimente nutritive',
    'categories.children': 'Articole pentru copii',
    'categories.toys': 'Jucării și jocuri',
    'categories.sports': 'Sport și fitness',
    'topDeals.title': 'Cele mai bune oferte',
    'footer.legal': 'Informații legale',
    'footer.contact': 'Contact',
    'footer.privacy': 'Confidențialitate',
    'footer.market': 'Piață',
    'footer.currency': 'Monedă',
    'footer.copyright': '© 2024 PriceComparise. Toate drepturile rezervate.'
  }
} as const;

export function detectMarket(): Market {
  // In a real app, this would check the actual domain
  // For demo purposes, default to HU where we have sample products
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  if (hostname.includes('.pl')) {
    return MARKETS.find(m => m.code === 'PL')!;
  }
  if (hostname.includes('.hu')) {
    return MARKETS.find(m => m.code === 'HU')!;
  }
  if (hostname.includes('.cz')) {
    return MARKETS.find(m => m.code === 'CZ')!;
  }
  if (hostname.includes('.ro')) {
    return MARKETS.find(m => m.code === 'RO')!;
  }
  
  return MARKETS.find(m => m.code === 'HU')!;
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