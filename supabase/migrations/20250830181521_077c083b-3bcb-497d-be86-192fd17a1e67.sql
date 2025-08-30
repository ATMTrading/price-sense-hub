-- Fix category structure and affiliate links

-- First, standardize market codes to uppercase
UPDATE categories SET market_code = 'SK' WHERE market_code = 'sk';
UPDATE shops SET market_code = 'SK' WHERE market_code = 'sk';
UPDATE products SET market_code = 'SK' WHERE market_code = 'sk';

-- Fix corrupted category names
UPDATE categories SET name = 'Knihy' WHERE name = '784';

-- Create proper main categories with descriptions
INSERT INTO categories (name, slug, description, market_code, parent_id, is_active) 
VALUES 
  ('Knihy a Médiá', 'knihy-a-media', 'Široký výber kníh, časopisov, e-kníh a multimediálneho obsahu pre všetky vekové kategórie.', 'SK', NULL, true),
  ('Elektronika a Technika', 'elektronika-technika', 'Najnovšie technológie, počítače, mobilné telefóny a elektronické zariadenia.', 'SK', NULL, true),
  ('Móda a Štýl', 'moda-styl', 'Trendy oblečenie, obuv, doplnky a módne akcesóriá pre dámy a pánov.', 'SK', NULL, true),
  ('Domov a Záhrada', 'domov-zahrada', 'Všetko pre váš domov, záhradu, dekorácie a domáce spotrebiče.', 'SK', NULL, true),
  ('Šport a Voľný čas', 'sport-volny-cas', 'Športové potreby, fitness vybavenie a aktivity pre voľný čas.', 'SK', NULL, true),
  ('Zdravie a Krása', 'zdravie-krasa', 'Kozmetika, parfumy, vitamíny a produkty pre zdravie a krásu.', 'SK', NULL, true),
  ('Deti a Rodina', 'deti-rodina', 'Detské potreby, hračky, oblečenie a všetko pre rodiny s deťmi.', 'SK', NULL, true),
  ('Auto a Doprava', 'auto-doprava', 'Automobilové potreby, náhradné diely a dopravné prostriedky.', 'SK', NULL, true)
ON CONFLICT (name, market_code) DO NOTHING;

-- Get main category IDs for reorganization
DO $$
DECLARE
    knihy_media_id UUID;
    elektronika_id UUID;
    moda_id UUID;
    domov_id UUID;
    sport_id UUID;
    zdravie_id UUID;
    deti_id UUID;
    auto_id UUID;
BEGIN
    -- Get main category IDs
    SELECT id INTO knihy_media_id FROM categories WHERE name = 'Knihy a Médiá' AND market_code = 'SK';
    SELECT id INTO elektronika_id FROM categories WHERE name = 'Elektronika a Technika' AND market_code = 'SK';
    SELECT id INTO moda_id FROM categories WHERE name = 'Móda a Štýl' AND market_code = 'SK';
    SELECT id INTO domov_id FROM categories WHERE name = 'Domov a Záhrada' AND market_code = 'SK';
    SELECT id INTO sport_id FROM categories WHERE name = 'Šport a Voľný čas' AND market_code = 'SK';
    SELECT id INTO zdravie_id FROM categories WHERE name = 'Zdravie a Krása' AND market_code = 'SK';
    SELECT id INTO deti_id FROM categories WHERE name = 'Deti a Rodina' AND market_code = 'SK';
    SELECT id INTO auto_id FROM categories WHERE name = 'Auto a Doprava' AND market_code = 'SK';

    -- Reorganize existing categories under main categories
    -- Books and Media subcategories
    UPDATE categories SET parent_id = knihy_media_id WHERE name IN ('Knihy', 'Beletria', 'Detské knihy', 'Náučná literatúra', 'Odborná literatúra', 'E-knihy', 'Časopisy', 'História', 'Náboženstvo', 'Vzdelávanie') AND market_code = 'SK';
    
    -- Electronics subcategories  
    UPDATE categories SET parent_id = elektronika_id WHERE name IN ('Elektronika', 'Počítače a tablety', 'Mobilné telefóny', 'Audio a TV', 'Foto a video', 'Smart hodinky', 'Herné konzoly', 'Príslušenstvo') AND market_code = 'SK';
    
    -- Fashion subcategories
    UPDATE categories SET parent_id = moda_id WHERE name IN ('Móda a Oblečenie', 'Dámske oblečenie', 'Pánske oblečenie', 'Dámska obuv', 'Pánska obuv', 'Šperky a hodinky', 'Tašky a peňaženky') AND market_code = 'SK';
    
    -- Home and Garden subcategories
    UPDATE categories SET parent_id = domov_id WHERE name IN ('Domáce spotrebiče', 'Nábytok', 'Dekorácie', 'Osvetlenie', 'Textil do domácnosti', 'Záhradné potreby') AND market_code = 'SK';
    
    -- Sports subcategories
    UPDATE categories SET parent_id = sport_id WHERE name IN ('Fitness', 'Cyklistika', 'Vodné športy', 'Zimné športy', 'Tímové športy', 'Outdoor aktivity', 'Hry a puzzle') AND market_code = 'SK';
    
    -- Health and Beauty subcategories  
    UPDATE categories SET parent_id = zdravie_id WHERE name IN ('Makeup', 'Parfumy', 'Starostlivosť o pleť', 'Starostlivosť o vlasy', 'Vitamíny a doplnky', 'Lekárenské potreby') AND market_code = 'SK';
    
    -- Children subcategories
    UPDATE categories SET parent_id = deti_id WHERE name IN ('Deti a Bábätká', 'Detské oblečenie', 'Detský nábytok', 'Detská kozmetika', 'Hračky', 'Kočíky a autosedačky', 'Školské potreby') AND market_code = 'SK';
    
    -- Auto subcategories
    UPDATE categories SET parent_id = auto_id WHERE name IN ('Auto a Motocykle', 'Autokozmetika', 'Motorky', 'Náhradné diely', 'Pneumatiky', 'Tuning') AND market_code = 'SK';
END $$;

-- Clean up duplicate shops - keep only the SK version with proper affiliate params
DELETE FROM shops WHERE name = 'Restorio.sk' AND (market_code != 'SK' OR affiliate_params = '{}' OR website_url IS NULL);

-- Update the remaining Restorio shop with proper configuration
UPDATE shops 
SET website_url = 'https://www.restorio.sk',
    affiliate_params = jsonb_build_object(
        'utm_source', 'dognet',
        'utm_medium', 'affiliate', 
        'utm_campaign', '68b053b92fff1',
        'a_aid', '68b053b92fff1',
        'a_cid', '908fbcd7',
        'chan', 'KZKBlu6j'
    )
WHERE name = 'Restorio.sk' AND market_code = 'SK';

-- Update all affiliate links to include proper tracking parameters
UPDATE affiliate_links 
SET affiliate_url = CASE 
    WHEN p.shop_id = s.id AND s.name = 'Restorio.sk' THEN 
        CONCAT(al.affiliate_url, '?utm_source=dognet&utm_medium=affiliate&utm_campaign=68b053b92fff1&a_aid=68b053b92fff1&a_cid=908fbcd7&chan=KZKBlu6j')
    ELSE al.affiliate_url
END,
updated_at = now()
FROM products p, shops s
WHERE affiliate_links.product_id = p.id AND p.shop_id = s.id;

-- Remove any duplicate categories with same name
DELETE FROM categories 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM categories 
    GROUP BY name, market_code
);