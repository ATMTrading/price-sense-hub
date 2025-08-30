-- Fix category structure and affiliate links (corrected version)

-- First, standardize market codes to uppercase
UPDATE categories SET market_code = 'SK' WHERE market_code = 'sk';
UPDATE shops SET market_code = 'SK' WHERE market_code = 'sk';
UPDATE products SET market_code = 'SK' WHERE market_code = 'sk';

-- Fix corrupted category names
UPDATE categories SET name = 'Knihy' WHERE name = '784';

-- Create proper main categories with descriptions (if they don't exist)
INSERT INTO categories (name, slug, description, market_code, parent_id, is_active) 
SELECT 'Knihy a Médiá', 'knihy-a-media', 'Široký výber kníh, časopisov, e-kníh a multimediálneho obsahu pre všetky vekové kategórie.', 'SK', NULL, true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Knihy a Médiá' AND market_code = 'SK');

INSERT INTO categories (name, slug, description, market_code, parent_id, is_active) 
SELECT 'Elektronika a Technika', 'elektronika-technika', 'Najnovšie technológie, počítače, mobilné telefóny a elektronické zariadenia.', 'SK', NULL, true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Elektronika a Technika' AND market_code = 'SK');

INSERT INTO categories (name, slug, description, market_code, parent_id, is_active) 
SELECT 'Móda a Štýl', 'moda-styl', 'Trendy oblečenie, obuv, doplnky a módne akcesóriá pre dámy a pánov.', 'SK', NULL, true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Móda a Štýl' AND market_code = 'SK');

INSERT INTO categories (name, slug, description, market_code, parent_id, is_active) 
SELECT 'Domov a Záhrada', 'domov-zahrada', 'Všetko pre váš domov, záhradu, dekorácie a domáce spotrebiče.', 'SK', NULL, true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Domov a Záhrada' AND market_code = 'SK');

INSERT INTO categories (name, slug, description, market_code, parent_id, is_active) 
SELECT 'Šport a Voľný čas', 'sport-volny-cas', 'Športové potreby, fitness vybavenie a aktivity pre voľný čas.', 'SK', NULL, true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Šport a Voľný čas' AND market_code = 'SK');

INSERT INTO categories (name, slug, description, market_code, parent_id, is_active) 
SELECT 'Zdravie a Krása', 'zdravie-krasa', 'Kozmetika, parfumy, vitamíny a produkty pre zdravie a krásu.', 'SK', NULL, true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Zdravie a Krása' AND market_code = 'SK');

INSERT INTO categories (name, slug, description, market_code, parent_id, is_active) 
SELECT 'Deti a Rodina', 'deti-rodina', 'Detské potreby, hračky, oblečenie a všetko pre rodiny s deťmi.', 'SK', NULL, true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Deti a Rodina' AND market_code = 'SK');

INSERT INTO categories (name, slug, description, market_code, parent_id, is_active) 
SELECT 'Auto a Doprava', 'auto-doprava', 'Automobilové potreby, náhradné diely a dopravné prostriedky.', 'SK', NULL, true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Auto a Doprava' AND market_code = 'SK');

-- Clean up duplicate shops - keep only the SK version with proper affiliate params
DELETE FROM shops WHERE name = 'Restorio.sk' AND (market_code != 'SK' OR affiliate_params::text = '{}' OR website_url IS NULL);

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