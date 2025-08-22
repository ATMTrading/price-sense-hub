import { Link } from 'react-router-dom';
import { useMarket } from '@/hooks/useMarket';
import { translate } from '@/lib/i18n';

export function Footer() {
  const { market } = useMarket();

  return (
    <footer className="border-t bg-muted/30 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 rounded gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="font-heading font-bold">PriceComparise</span>
            </div>
            <p className="text-muted-foreground text-sm">
              {translate('hero.subtitle', market)}
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-4">{translate('nav.categories', market)}</h3>
            <div className="space-y-2 text-sm">
              <Link to="/c/electronics" className="block text-muted-foreground hover:text-foreground transition-smooth">
                {translate('categories.electronics', market)}
              </Link>
              <Link to="/c/health" className="block text-muted-foreground hover:text-foreground transition-smooth">
                {translate('categories.health', market)}
              </Link>
              <Link to="/c/children" className="block text-muted-foreground hover:text-foreground transition-smooth">
                {translate('categories.children', market)}
              </Link>
              <Link to="/c/sports" className="block text-muted-foreground hover:text-foreground transition-smooth">
                {translate('categories.sports', market)}
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">{translate('footer.legal', market)}</h3>
            <div className="space-y-2 text-sm">
              <Link to="/privacy" className="block text-muted-foreground hover:text-foreground transition-smooth">
                {translate('footer.privacy', market)}
              </Link>
              <Link to="/contact" className="block text-muted-foreground hover:text-foreground transition-smooth">
                {translate('footer.contact', market)}
              </Link>
            </div>
          </div>

          {/* Market Info */}
          <div>
            <h3 className="font-semibold mb-4">{translate('footer.market', market)}</h3>
            <div className="text-sm text-muted-foreground">
              <p>{market.flag} {market.currency}</p>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>{translate('footer.copyright', market)}</p>
        </div>
      </div>
    </footer>
  );
}