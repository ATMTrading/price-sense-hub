-- Add parent_id column to categories table to support subcategories
ALTER TABLE public.categories 
ADD COLUMN parent_id uuid REFERENCES public.categories(id);

-- Create index for better performance on parent-child queries
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);

-- Insert subcategories for SK market
-- Electronics subcategories
INSERT INTO public.categories (name, slug, market_code, parent_id, is_active) VALUES
('Mobilné telefóny', 'mobilne-telefony', 'SK', (SELECT id FROM public.categories WHERE slug = 'elektronika' AND market_code = 'SK'), true),
('Notebooky', 'notebooky', 'SK', (SELECT id FROM public.categories WHERE slug = 'elektronika' AND market_code = 'SK'), true),
('Tablety', 'tablety', 'SK', (SELECT id FROM public.categories WHERE slug = 'elektronika' AND market_code = 'SK'), true),
('Slúchadlá a Audio', 'sluchadla-audio', 'SK', (SELECT id FROM public.categories WHERE slug = 'elektronika' AND market_code = 'SK'), true),
('Televízory', 'televizory', 'SK', (SELECT id FROM public.categories WHERE slug = 'elektronika' AND market_code = 'SK'), true),
('Herné konzoly', 'herne-konzoly', 'SK', (SELECT id FROM public.categories WHERE slug = 'elektronika' AND market_code = 'SK'), true),
('Fotoaparáty a Kamery', 'fotoaparaty-kamery', 'SK', (SELECT id FROM public.categories WHERE slug = 'elektronika' AND market_code = 'SK'), true),
('Príslušenstvo k elektronike', 'prislusenstvo-elektronike', 'SK', (SELECT id FROM public.categories WHERE slug = 'elektronika' AND market_code = 'SK'), true);

-- Fashion subcategories
INSERT INTO public.categories (name, slug, market_code, parent_id, is_active) VALUES
('Dámske oblečenie', 'damske-oblecenie', 'SK', (SELECT id FROM public.categories WHERE slug = 'moda-oblecenie' AND market_code = 'SK'), true),
('Pánske oblečenie', 'panske-oblecenie', 'SK', (SELECT id FROM public.categories WHERE slug = 'moda-oblecenie' AND market_code = 'SK'), true),
('Obuv', 'obuv', 'SK', (SELECT id FROM public.categories WHERE slug = 'moda-oblecenie' AND market_code = 'SK'), true),
('Tašky a Kabelky', 'tasky-kabelky', 'SK', (SELECT id FROM public.categories WHERE slug = 'moda-oblecenie' AND market_code = 'SK'), true),
('Hodinky a Šperky', 'hodinky-sperky', 'SK', (SELECT id FROM public.categories WHERE slug = 'moda-oblecenie' AND market_code = 'SK'), true),
('Doplnky', 'doplnky', 'SK', (SELECT id FROM public.categories WHERE slug = 'moda-oblecenie' AND market_code = 'SK'), true);

-- Health & Beauty subcategories
INSERT INTO public.categories (name, slug, market_code, parent_id, is_active) VALUES
('Vitamíny a Doplnky', 'vitaminy-doplnky', 'SK', (SELECT id FROM public.categories WHERE slug = 'zdravie-krasa' AND market_code = 'SK'), true),
('Kozmetika a Starostlivosť o pleť', 'kozmetika-starostlivost-plet', 'SK', (SELECT id FROM public.categories WHERE slug = 'zdravie-krasa' AND market_code = 'SK'), true),
('Vlasová starostlivosť', 'vlasova-starostlivost', 'SK', (SELECT id FROM public.categories WHERE slug = 'zdravie-krasa' AND market_code = 'SK'), true),
('Parfémy a Vône', 'parfemy-vone', 'SK', (SELECT id FROM public.categories WHERE slug = 'zdravie-krasa' AND market_code = 'SK'), true),
('Zdravotnícke potreby', 'zdravotnicke-potreby', 'SK', (SELECT id FROM public.categories WHERE slug = 'zdravie-krasa' AND market_code = 'SK'), true),
('Prírodné produkty a Drogéria', 'prirodne-produkty-drogeria', 'SK', (SELECT id FROM public.categories WHERE slug = 'zdravie-krasa' AND market_code = 'SK'), true);

-- Home & Garden subcategories
INSERT INTO public.categories (name, slug, market_code, parent_id, is_active) VALUES
('Nábytok', 'nabytok', 'SK', (SELECT id FROM public.categories WHERE slug = 'domov-zahrada' AND market_code = 'SK'), true),
('Kuchynské spotrebiče', 'kuchynske-spotrebice', 'SK', (SELECT id FROM public.categories WHERE slug = 'domov-zahrada' AND market_code = 'SK'), true),
('Domáce spotrebiče', 'domace-spotrebice', 'SK', (SELECT id FROM public.categories WHERE slug = 'domov-zahrada' AND market_code = 'SK'), true),
('Dekorácie a Doplnky', 'dekoracie-doplnky', 'SK', (SELECT id FROM public.categories WHERE slug = 'domov-zahrada' AND market_code = 'SK'), true),
('Záhradné náradie a Technika', 'zahradne-naradie-technika', 'SK', (SELECT id FROM public.categories WHERE slug = 'domov-zahrada' AND market_code = 'SK'), true),
('Osvetlenie', 'osvetlenie', 'SK', (SELECT id FROM public.categories WHERE slug = 'domov-zahrada' AND market_code = 'SK'), true);

-- Sports & Leisure subcategories
INSERT INTO public.categories (name, slug, market_code, parent_id, is_active) VALUES
('Fitness vybavenie', 'fitness-vybavenie', 'SK', (SELECT id FROM public.categories WHERE slug = 'sport-volny-cas' AND market_code = 'SK'), true),
('Športové oblečenie a obuv', 'sportove-oblecenie-obuv', 'SK', (SELECT id FROM public.categories WHERE slug = 'sport-volny-cas' AND market_code = 'SK'), true),
('Outdoor a Turistika', 'outdoor-turistika', 'SK', (SELECT id FROM public.categories WHERE slug = 'sport-volny-cas' AND market_code = 'SK'), true),
('Cyklistika', 'cyklistika', 'SK', (SELECT id FROM public.categories WHERE slug = 'sport-volny-cas' AND market_code = 'SK'), true),
('Loptové športy', 'loptove-sporty', 'SK', (SELECT id FROM public.categories WHERE slug = 'sport-volny-cas' AND market_code = 'SK'), true),
('Kempovanie a Camping', 'kempovanie-camping', 'SK', (SELECT id FROM public.categories WHERE slug = 'sport-volny-cas' AND market_code = 'SK'), true);

-- Kids & Baby subcategories
INSERT INTO public.categories (name, slug, market_code, parent_id, is_active) VALUES
('Oblečenie pre bábätká a deti', 'oblecenie-babatka-deti', 'SK', (SELECT id FROM public.categories WHERE slug = 'deti-babatka' AND market_code = 'SK'), true),
('Hračky', 'hracky', 'SK', (SELECT id FROM public.categories WHERE slug = 'deti-babatka' AND market_code = 'SK'), true),
('Kočíky a Autosedačky', 'kociky-autosedacky', 'SK', (SELECT id FROM public.categories WHERE slug = 'deti-babatka' AND market_code = 'SK'), true),
('Detská výživa', 'detska-vyziva', 'SK', (SELECT id FROM public.categories WHERE slug = 'deti-babatka' AND market_code = 'SK'), true),
('Starostlivosť o bábätko', 'starostlivost-babatko', 'SK', (SELECT id FROM public.categories WHERE slug = 'deti-babatka' AND market_code = 'SK'), true);

-- Books & Media subcategories
INSERT INTO public.categories (name, slug, market_code, parent_id, is_active) VALUES
('Knihy', 'knihy', 'SK', (SELECT id FROM public.categories WHERE slug = 'knihy-media' AND market_code = 'SK'), true),
('E-knihy', 'e-knihy', 'SK', (SELECT id FROM public.categories WHERE slug = 'knihy-media' AND market_code = 'SK'), true),
('Hudba', 'hudba', 'SK', (SELECT id FROM public.categories WHERE slug = 'knihy-media' AND market_code = 'SK'), true),
('Filmy a Seriály', 'filmy-serialy', 'SK', (SELECT id FROM public.categories WHERE slug = 'knihy-media' AND market_code = 'SK'), true),
('Videohry', 'videohry', 'SK', (SELECT id FROM public.categories WHERE slug = 'knihy-media' AND market_code = 'SK'), true);

-- Auto & Motorcycles subcategories
INSERT INTO public.categories (name, slug, market_code, parent_id, is_active) VALUES
('Pneumatiky', 'pneumatiky', 'SK', (SELECT id FROM public.categories WHERE slug = 'auto-motocykle' AND market_code = 'SK'), true),
('Autodiely', 'autodiely', 'SK', (SELECT id FROM public.categories WHERE slug = 'auto-motocykle' AND market_code = 'SK'), true),
('Motodiely', 'motodiely', 'SK', (SELECT id FROM public.categories WHERE slug = 'auto-motocykle' AND market_code = 'SK'), true),
('Oleje a Kvapaliny', 'oleje-kvapaliny', 'SK', (SELECT id FROM public.categories WHERE slug = 'auto-motocykle' AND market_code = 'SK'), true),
('Autopríslušenstvo', 'autoprislusenstvo', 'SK', (SELECT id FROM public.categories WHERE slug = 'auto-motocykle' AND market_code = 'SK'), true),
('Motopríslušenstvo', 'motoprislusenstvo', 'SK', (SELECT id FROM public.categories WHERE slug = 'auto-motocykle' AND market_code = 'SK'), true);