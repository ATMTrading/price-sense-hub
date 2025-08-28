import { Helmet } from 'react-helmet-async';
import { useMarket } from '@/hooks/useMarket';

interface GoogleShoppingMetaProps {
  title?: string;
  description?: string;
  type?: 'website' | 'product.group' | 'product.item';
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
    productCount?: number;
  }>;
}

export function GoogleShoppingMeta({ 
  title = "Najlepšie online nákupy na Slovensku",
  description = "Porovnajte ceny a nájdite najlepšie ponuky z tisícov slovenských e-shopov. Elektronika, móda, domov, zdravie a ďalšie kategórie.",
  type = "website",
  categories 
}: GoogleShoppingMetaProps) {
  const { market } = useMarket();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "NajlepšieNákupy.sk",
    "description": description,
    "url": window.location.origin,
    "inLanguage": market.locale,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${window.location.origin}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  const breadcrumbStructuredData = categories ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": categories.map((category, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": category.name,
      "item": `${window.location.origin}/c/${category.slug}`
    }))
  } : null;

  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "NajlepšieNákupy.sk",
    "url": window.location.origin,
    "logo": `${window.location.origin}/logo.png`,
    "sameAs": [],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "areaServed": "SK",
      "availableLanguage": "sk"
    }
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      
      {/* Language and Locale */}
      <html lang="sk" />
      <meta name="language" content="Slovak" />
      <link rel="alternate" hrefLang="sk" href={window.location.href} />
      <link rel="canonical" href={window.location.href} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={window.location.href} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content="NajlepšieNákupy.sk" />
      <meta property="og:locale" content="sk_SK" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={window.location.href} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      
      {/* Google Shopping CSS */}
      <meta name="google-site-verification" content="" />
      <meta name="msvalidate.01" content="" />
      <meta name="yandex-verification" content="" />
      
      {/* Price and Currency for Products */}
      <meta property="product:price:currency" content={market.currency} />
      <meta property="product:availability" content="in stock" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      
      {breadcrumbStructuredData && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbStructuredData)}
        </script>
      )}
      
      <script type="application/ld+json">
        {JSON.stringify(organizationData)}
      </script>
    </Helmet>
  );
}