-- Remove the fake Samsung TV product and its affiliate links
DELETE FROM affiliate_links WHERE product_id = '96fdfdc0-4205-4a1b-b597-cc88d4d7eabf';
DELETE FROM products WHERE id = '96fdfdc0-4205-4a1b-b597-cc88d4d7eabf';

-- Standardize market codes to uppercase "HU" for all products
UPDATE products SET market_code = 'HU' WHERE market_code = 'hu';
UPDATE shops SET market_code = 'HU' WHERE market_code = 'hu';
UPDATE categories SET market_code = 'HU' WHERE market_code = 'hu';

-- Remove duplicate HU categories (we'll keep the lowercase ones and change their market_code)
DELETE FROM categories WHERE market_code = 'HU' AND slug IN ('electronics', 'fashion', 'health-beauty', 'home-garden', 'sports', 'baby-kids', 'books-media', 'automotive');

-- Update affiliate links for real products with proper Dognet URLs
UPDATE affiliate_links 
SET affiliate_url = 'https://go.dognet.com/?chid=IzDRhdYj&url=https://www.4home.hu/bellatex-frotte-lepedo-vilagos-zold-160-x-200-cm-vilagoszold-160-x-200-cm'
WHERE product_id = 'de4ff0c5-b9f2-4ce7-a75e-32968d21a7c0';

UPDATE affiliate_links 
SET affiliate_url = 'https://go.dognet.com/?chid=IzDRhdYj&url=https://www.4home.hu/mini-relax-redony-sotet-szurke-57-x-150-cm-soteszurke-57-x-150-cm'
WHERE product_id = '2af99011-eb2d-4aec-86b6-fb13a3722b38';

UPDATE affiliate_links 
SET affiliate_url = 'https://go.dognet.com/?chid=IzDRhdYj&url=https://www.4home.hu/curver-jute-l-20-l-kosar-taupe'
WHERE product_id = '6d9b551f-1312-4d08-b99c-1b4fd72d3b71';

UPDATE affiliate_links 
SET affiliate_url = 'https://go.dognet.com/?chid=IzDRhdYj&url=https://www.4home.hu/de-buyer-1964-01-szilikon-forma-moulflex-briosky-6-db'
WHERE product_id = '22b6e792-9142-4d65-be6e-fa4485032c23';

UPDATE affiliate_links 
SET affiliate_url = 'https://go.dognet.com/?chid=IzDRhdYj&url=https://www.4home.hu/4home-red-hearts-pamut-agynemuhuzat-220-x-200-cm-2-db-70-x-90-cm'
WHERE product_id = '66ecda9d-99db-4c8c-bc3c-240558f46f9d';

-- Map imported products to the main categories we created earlier
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'home-garden' AND market_code = 'HU' LIMIT 1) 
WHERE market_code = 'HU' AND shop_id IN (SELECT id FROM shops WHERE name IN ('Bellatex', 'Gardinia', 'Curver', '4Home'));

UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'home-garden' AND market_code = 'HU' LIMIT 1)
WHERE market_code = 'HU' AND shop_id = (SELECT id FROM shops WHERE name = 'De Buyer' LIMIT 1);