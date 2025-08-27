
import { Layout } from '@/components/Layout';
import { useMarket } from '@/hooks/useMarket';
import { translate } from '@/lib/i18n';

export default function Terms() {
  const { market } = useMarket();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-heading font-bold mb-8">
            {translate('footer.terms', market)}
          </h1>
          
          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Általános rendelkezések</h2>
              <p className="text-muted-foreground leading-relaxed">
                Jelen felhasználási feltételek (a továbbiakban: "Feltételek") szabályozzák a bestpric.eu weboldal használatát. 
                A weboldal használatával Ön elfogadja ezeket a feltételeket.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. A szolgáltatás leírása</h2>
              <p className="text-muted-foreground leading-relaxed">
                A bestpric.eu egy árösszehasonlító platform, amely lehetővé teszi a felhasználók számára, hogy különböző 
                online áruházak termékeit és árait hasonlítsák össze.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Felhasználói kötelezettségek</h2>
              <p className="text-muted-foreground leading-relaxed">
                A felhasználók kötelesek a szolgáltatást jogszerűen használni, és tartózkodni minden olyan 
                tevékenységtől, amely károsíthatja a weboldal működését vagy más felhasználók jogait.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Szellemi tulajdon</h2>
              <p className="text-muted-foreground leading-relaxed">
                A weboldal tartalma szerzői jogvédelem alatt áll. A tartalom másolása, terjesztése csak 
                előzetes írásbeli engedéllyel lehetséges.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Felelősség korlátozása</h2>
              <p className="text-muted-foreground leading-relaxed">
                A bestpric.eu nem vállal felelősséget a partneroldalakon megjelenő árak pontosságáért, 
                a termékek elérhetőségéért vagy a vásárlási folyamatért.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Kapcsolat</h2>
              <p className="text-muted-foreground leading-relaxed">
                Kérdések esetén forduljon hozzánk a kapcsolat oldalon található elérhetőségeken keresztül.
              </p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
