import { Header } from '@/components/Layout/Header';
import { Footer } from '@/components/Layout/Footer';
import { useMarket } from '@/hooks/useMarket';
import { translate } from '@/lib/i18n';

export default function Privacy() {
  const { market } = useMarket();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-heading text-3xl font-bold mb-8 text-center">
            {translate('footer.privacy', market)}
          </h1>
          
          <div className="bg-card rounded-lg p-8 shadow-sm border">
            <p className="text-muted-foreground text-center">
              Privacy policy content will be added here.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}