import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useMarket } from "@/hooks/useMarket";
import { translate } from "@/lib/i18n";

const NotFound = () => {
  const location = useLocation();
  const { market } = useMarket();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-4">
          {translate('msg.noResults', market)}
        </p>
        <Link 
          to="/" 
          className="text-primary hover:text-primary/80 underline transition-smooth"
        >
          {translate('nav.home', market)}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
