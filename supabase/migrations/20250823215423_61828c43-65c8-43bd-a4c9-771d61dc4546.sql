-- Fix shop data: consolidate all products to 4home.hu shop
-- First, ensure we have the correct 4home shop
UPDATE shops 
SET name = '4Home', website_url = 'https://4home.hu'
WHERE name = '4home' OR name ILIKE '%4home%';

-- Delete duplicate/incorrect shops
DELETE FROM shops 
WHERE name IN ('Bellatex', 'Gardinia', 'Curver', 'De Buyer') 
AND market_code = 'HU';

-- Get the correct 4home shop ID and assign all products to it
UPDATE products 
SET shop_id = (SELECT id FROM shops WHERE name = '4Home' AND market_code = 'HU' LIMIT 1)
WHERE market_code = 'HU' AND is_active = true;

-- Fix category assignments: move products from subcategories to main categories
-- Bedding and textiles → Home & Garden
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE slug = 'home-garden' AND market_code = 'HU' LIMIT 1)
WHERE market_code = 'HU' 
AND category_id IN (
    SELECT id FROM categories 
    WHERE market_code = 'HU' 
    AND (name ILIKE '%lakástextil%' OR name ILIKE '%ágyneműhuzat%' OR name ILIKE '%lepedő%' OR name ILIKE '%redőny%')
);

-- Kitchen and storage items → Home & Garden
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE slug = 'home-garden' AND market_code = 'HU' LIMIT 1)
WHERE market_code = 'HU' 
AND category_id IN (
    SELECT id FROM categories 
    WHERE market_code = 'HU' 
    AND (name ILIKE '%konyha%' OR name ILIKE '%tároló%' OR name ILIKE '%otthon és élet%')
);

-- Remove subcategories that are no longer needed (keep only main categories)
DELETE FROM categories 
WHERE market_code = 'HU' 
AND slug NOT IN ('electronics', 'fashion', 'health-beauty', 'home-garden', 'sports', 'baby-kids', 'books-media', 'automotive');

-- Update affiliate links to ensure they all use 4home.hu domain
UPDATE affiliate_links 
SET affiliate_url = 'https://go.dognet.com/?chid=IzDRhdYj&url=' || 
    CASE 
        WHEN p.title ILIKE '%bellatex%frotte%lepedo%' THEN 'https://www.4home.hu/bellatex-frotte-lepedo-vilagos-zold-160-x-200-cm'
        WHEN p.title ILIKE '%mini%relax%redony%' THEN 'https://www.4home.hu/gardinia-mini-relax-redony-sotet-szurke-57-x-150-cm'
        WHEN p.title ILIKE '%curver%jute%kosar%' THEN 'https://www.4home.hu/curver-jute-l-20-l-kosar-taupe'
        WHEN p.title ILIKE '%de buyer%szilikon%forma%' THEN 'https://www.4home.hu/de-buyer-szilikon-forma-moul-flex-briosky-6-db'
        WHEN p.title ILIKE '%4home%red hearts%pamut%' THEN 'https://www.4home.hu/4home-red-hearts-pamut-agynemuhuzat-220-x-200-cm'
        ELSE 'https://www.4home.hu/'
    END
FROM products p
WHERE affiliate_links.product_id = p.id AND p.market_code = 'HU';