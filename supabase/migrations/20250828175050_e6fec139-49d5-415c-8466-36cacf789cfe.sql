-- First, let's clean up and restructure the categories for Slovak market
-- Delete all existing categories for SK market to start fresh
DELETE FROM categories WHERE market_code = 'SK';

-- Insert main categories with proper slugs and descriptions
INSERT INTO categories (name, slug, market_code, description, parent_id, is_active) VALUES
-- Main categories (parent_id = NULL)
('Elektronika', 'elektronika', 'SK', 'Elektronické zariadenia, mobily, počítače a príslušenstvo', NULL, true),
('Móda a Oblečenie', 'moda-a-oblecenie', 'SK', 'Oblečenie, obuv a módne doplnky pre mužov a ženy', NULL, true),
('Zdravie a Krása', 'zdravie-a-krasa', 'SK', 'Produkty pre zdravie, krásu a osobnú starostlivosť', NULL, true),
('Domov a Záhrada', 'domov-a-zahrada', 'SK', 'Produkty pre domov, záhradu a domácnosť', NULL, true),
('Šport a Voľný čas', 'sport-a-volny-cas', 'SK', 'Športové potreby a produkty pre voľný čas', NULL, true),
('Deti a Bábätká', 'deti-a-babatka', 'SK', 'Produkty pre deti a bábätká všetkých vekových kategórií', NULL, true),
('Knihy a Médiá', 'knihy-a-media', 'SK', 'Knihy, filmy, hudba a ostatné mediálne produkty', NULL, true),
('Auto a Motocykle', 'auto-a-motocykle', 'SK', 'Produkty pre autá, motocykle a dopravné prostriedky', NULL, true);

-- Now insert subcategories with proper parent_id references
-- Get the IDs of main categories for reference
WITH main_cats AS (
  SELECT id, slug FROM categories WHERE market_code = 'SK' AND parent_id IS NULL
)

-- Electronics subcategories
INSERT INTO categories (name, slug, market_code, parent_id, is_active)
SELECT 'Mobilné telefóny', 'mobilne-telefony', 'SK', id, true FROM main_cats WHERE slug = 'elektronika'
UNION ALL
SELECT 'Počítače a tablety', 'pocitace-a-tablety', 'SK', id, true FROM main_cats WHERE slug = 'elektronika'
UNION ALL
SELECT 'Audio a TV', 'audio-a-tv', 'SK', id, true FROM main_cats WHERE slug = 'elektronika'
UNION ALL
SELECT 'Foto a video', 'foto-a-video', 'SK', id, true FROM main_cats WHERE slug = 'elektronika'
UNION ALL
SELECT 'Herné konzoly', 'herne-konzoly', 'SK', id, true FROM main_cats WHERE slug = 'elektronika'
UNION ALL
SELECT 'Smart hodinky', 'smart-hodinky', 'SK', id, true FROM main_cats WHERE slug = 'elektronika'

-- Fashion subcategories
UNION ALL
SELECT 'Dámske oblečenie', 'damske-oblecenie', 'SK', id, true FROM main_cats WHERE slug = 'moda-a-oblecenie'
UNION ALL
SELECT 'Pánske oblečenie', 'panske-oblecenie', 'SK', id, true FROM main_cats WHERE slug = 'moda-a-oblecenie'
UNION ALL
SELECT 'Dámska obuv', 'damska-obuv', 'SK', id, true FROM main_cats WHERE slug = 'moda-a-oblecenie'
UNION ALL
SELECT 'Pánska obuv', 'panska-obuv', 'SK', id, true FROM main_cats WHERE slug = 'moda-a-oblecenie'
UNION ALL
SELECT 'Šperky a hodinky', 'sperky-a-hodinky', 'SK', id, true FROM main_cats WHERE slug = 'moda-a-oblecenie'
UNION ALL
SELECT 'Tašky a peňaženky', 'tasky-a-penazenky', 'SK', id, true FROM main_cats WHERE slug = 'moda-a-oblecenie'

-- Health & Beauty subcategories
UNION ALL
SELECT 'Parfumy', 'parfumy', 'SK', id, true FROM main_cats WHERE slug = 'zdravie-a-krasa'
UNION ALL
SELECT 'Starostlivosť o pleť', 'starostlivost-o-plet', 'SK', id, true FROM main_cats WHERE slug = 'zdravie-a-krasa'
UNION ALL
SELECT 'Makeup', 'makeup', 'SK', id, true FROM main_cats WHERE slug = 'zdravie-a-krasa'
UNION ALL
SELECT 'Starostlivosť o vlasy', 'starostlivost-o-vlasy', 'SK', id, true FROM main_cats WHERE slug = 'zdravie-a-krasa'
UNION ALL
SELECT 'Vitamíny a doplnky', 'vitaminy-a-doplnky', 'SK', id, true FROM main_cats WHERE slug = 'zdravie-a-krasa'
UNION ALL
SELECT 'Lekárenské potreby', 'lekárenske-potreby', 'SK', id, true FROM main_cats WHERE slug = 'zdravie-a-krasa'

-- Home & Garden subcategories
UNION ALL
SELECT 'Nábytok', 'nabytok', 'SK', id, true FROM main_cats WHERE slug = 'domov-a-zahrada'
UNION ALL
SELECT 'Domáce spotrebiče', 'domace-spotrebice', 'SK', id, true FROM main_cats WHERE slug = 'domov-a-zahrada'
UNION ALL
SELECT 'Záhradné potreby', 'zahradne-potreby', 'SK', id, true FROM main_cats WHERE slug = 'domov-a-zahrada'
UNION ALL
SELECT 'Dekorácie', 'dekoracie', 'SK', id, true FROM main_cats WHERE slug = 'domov-a-zahrada'
UNION ALL
SELECT 'Osvetlenie', 'osvetlenie', 'SK', id, true FROM main_cats WHERE slug = 'domov-a-zahrada'
UNION ALL
SELECT 'Textil do domácnosti', 'textil-do-domacnosti', 'SK', id, true FROM main_cats WHERE slug = 'domov-a-zahrada'

-- Sports & Leisure subcategories
UNION ALL
SELECT 'Fitness', 'fitness', 'SK', id, true FROM main_cats WHERE slug = 'sport-a-volny-cas'
UNION ALL
SELECT 'Outdoor aktivity', 'outdoor-aktivity', 'SK', id, true FROM main_cats WHERE slug = 'sport-a-volny-cas'
UNION ALL
SELECT 'Cyklistika', 'cyklistika', 'SK', id, true FROM main_cats WHERE slug = 'sport-a-volny-cas'
UNION ALL
SELECT 'Zimné športy', 'zimne-sporty', 'SK', id, true FROM main_cats WHERE slug = 'sport-a-volny-cas'
UNION ALL
SELECT 'Vodné športy', 'vodne-sporty', 'SK', id, true FROM main_cats WHERE slug = 'sport-a-volny-cas'
UNION ALL
SELECT 'Tímové športy', 'timove-sporty', 'SK', id, true FROM main_cats WHERE slug = 'sport-a-volny-cas'

-- Kids & Baby subcategories
UNION ALL
SELECT 'Detské oblečenie', 'detske-oblecenie', 'SK', id, true FROM main_cats WHERE slug = 'deti-a-babatka'
UNION ALL
SELECT 'Hračky', 'hracky', 'SK', id, true FROM main_cats WHERE slug = 'deti-a-babatka'
UNION ALL
SELECT 'Detský nábytok', 'detsky-nabytok', 'SK', id, true FROM main_cats WHERE slug = 'deti-a-babatka'
UNION ALL
SELECT 'Kočíky a autosedačky', 'kociky-a-autosedacky', 'SK', id, true FROM main_cats WHERE slug = 'deti-a-babatka'
UNION ALL
SELECT 'Detská kozmetika', 'detska-kozmetika', 'SK', id, true FROM main_cats WHERE slug = 'deti-a-babatka'
UNION ALL
SELECT 'Školské potreby', 'skolske-potreby', 'SK', id, true FROM main_cats WHERE slug = 'deti-a-babatka'

-- Books & Media subcategories
UNION ALL
SELECT 'Knihy', 'knihy', 'SK', id, true FROM main_cats WHERE slug = 'knihy-a-media'
UNION ALL
SELECT 'Filmy a seriály', 'filmy-a-serialy', 'SK', id, true FROM main_cats WHERE slug = 'knihy-a-media'
UNION ALL
SELECT 'Hudba', 'hudba', 'SK', id, true FROM main_cats WHERE slug = 'knihy-a-media'
UNION ALL
SELECT 'Hry a puzzle', 'hry-a-puzzle', 'SK', id, true FROM main_cats WHERE slug = 'knihy-a-media'
UNION ALL
SELECT 'E-knihy', 'e-knihy', 'SK', id, true FROM main_cats WHERE slug = 'knihy-a-media'
UNION ALL
SELECT 'Časopisy', 'casopisy', 'SK', id, true FROM main_cats WHERE slug = 'knihy-a-media'

-- Auto & Motorcycles subcategories
UNION ALL
SELECT 'Náhradné diely', 'nahradne-diely', 'SK', id, true FROM main_cats WHERE slug = 'auto-a-motocykle'
UNION ALL
SELECT 'Autokozmetika', 'autokozmetika', 'SK', id, true FROM main_cats WHERE slug = 'auto-a-motocykle'
UNION ALL
SELECT 'Pneumatiky', 'pneumatiky', 'SK', id, true FROM main_cats WHERE slug = 'auto-a-motocykle'
UNION ALL
SELECT 'Motorky', 'motorky', 'SK', id, true FROM main_cats WHERE slug = 'auto-a-motocykle'
UNION ALL
SELECT 'Tuning', 'tuning', 'SK', id, true FROM main_cats WHERE slug = 'auto-a-motocykle'
UNION ALL
SELECT 'Príslušenstvo', 'prislusenstvo', 'SK', id, true FROM main_cats WHERE slug = 'auto-a-motocykle';