-- Organize categories under main categories and fix affiliate links

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
    UPDATE categories SET parent_id = knihy_media_id WHERE name IN ('Knihy', 'Beletria', 'Detské knihy', 'Náučná literatúra', 'Odborná literatúra', 'E-knihy', 'Časopisy', 'História', 'Náboženstvo', 'Vzdelávanie', 'Filmy a seriály', 'Hudba') AND market_code = 'SK' AND parent_id IS NULL;
    
    -- Electronics subcategories  
    UPDATE categories SET parent_id = elektronika_id WHERE name IN ('Elektronika', 'Počítače a tablety', 'Mobilné telefóny', 'Audio a TV', 'Foto a video', 'Smart hodinky', 'Herné konzoly', 'Príslušenstvo') AND market_code = 'SK' AND parent_id IS NULL;
    
    -- Fashion subcategories
    UPDATE categories SET parent_id = moda_id WHERE name IN ('Móda a Oblečenie', 'Dámske oblečenie', 'Pánske oblečenie', 'Dámska obuv', 'Pánska obuv', 'Šperky a hodinky', 'Tašky a peňaženky') AND market_code = 'SK' AND parent_id IS NULL;
    
    -- Home and Garden subcategories
    UPDATE categories SET parent_id = domov_id WHERE name IN ('Domáce spotrebiče', 'Nábytok', 'Dekorácie', 'Osvetlenie', 'Textil do domácnosti', 'Záhradné potreby') AND market_code = 'SK' AND parent_id IS NULL;
    
    -- Sports subcategories
    UPDATE categories SET parent_id = sport_id WHERE name IN ('Fitness', 'Cyklistika', 'Vodné športy', 'Zimné športy', 'Tímové športy', 'Outdoor aktivity', 'Hry a puzzle') AND market_code = 'SK' AND parent_id IS NULL;
    
    -- Health and Beauty subcategories  
    UPDATE categories SET parent_id = zdravie_id WHERE name IN ('Makeup', 'Parfumy', 'Starostlivosť o pleť', 'Starostlivosť o vlasy', 'Vitamíny a doplnky', 'Lekárenské potreby') AND market_code = 'SK' AND parent_id IS NULL;
    
    -- Children subcategories
    UPDATE categories SET parent_id = deti_id WHERE name IN ('Deti a Bábätká', 'Detské oblečenie', 'Detský nábytok', 'Detská kozmetika', 'Hračky', 'Kočíky a autosedačky', 'Školské potreby') AND market_code = 'SK' AND parent_id IS NULL;
    
    -- Auto subcategories
    UPDATE categories SET parent_id = auto_id WHERE name IN ('Auto a Motocykle', 'Autokozmetika', 'Motorky', 'Náhradné diely', 'Pneumatiky', 'Tuning') AND market_code = 'SK' AND parent_id IS NULL;
END $$;

-- Update all affiliate links to include proper tracking parameters
UPDATE affiliate_links 
SET affiliate_url = CASE 
    WHEN al.affiliate_url NOT LIKE '%utm_source%' AND p.shop_id IN (SELECT id FROM shops WHERE name = 'Restorio.sk' AND market_code = 'SK') THEN 
        CASE 
            WHEN al.affiliate_url LIKE '%?%' THEN 
                CONCAT(al.affiliate_url, '&utm_source=dognet&utm_medium=affiliate&utm_campaign=68b053b92fff1&a_aid=68b053b92fff1&a_cid=908fbcd7&chan=KZKBlu6j')
            ELSE 
                CONCAT(al.affiliate_url, '?utm_source=dognet&utm_medium=affiliate&utm_campaign=68b053b92fff1&a_aid=68b053b92fff1&a_cid=908fbcd7&chan=KZKBlu6j')
        END
    ELSE al.affiliate_url
END,
updated_at = now()
FROM products p
WHERE affiliate_links.product_id = p.id;

-- Remove any duplicate categories with same name (keep the one with parent_id if exists, otherwise keep the first one)
DELETE FROM categories a USING categories b
WHERE a.id > b.id 
AND a.name = b.name 
AND a.market_code = b.market_code
AND (
    (a.parent_id IS NULL AND b.parent_id IS NOT NULL) OR
    (a.parent_id IS NULL AND b.parent_id IS NULL)
);