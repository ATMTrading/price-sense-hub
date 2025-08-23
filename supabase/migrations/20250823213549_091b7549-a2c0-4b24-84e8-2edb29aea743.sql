-- Now add all main categories for the HU market
INSERT INTO categories (name, slug, market_code, is_active) VALUES
('Elektronika', 'electronics', 'HU', true),
('Divat és Ruházat', 'fashion', 'HU', true),
('Egészség és Szépség', 'health-beauty', 'HU', true),
('Otthon és Kert', 'home-garden', 'HU', true),
('Sport és Szabadidő', 'sports', 'HU', true),
('Gyermek és Baba', 'baby-kids', 'HU', true),
('Könyv és Média', 'books-media', 'HU', true),
('Autó és Motor', 'automotive', 'HU', true)
ON CONFLICT (slug, market_code) DO NOTHING;

-- Update affiliate links for all real imported products with proper Dognet URLs based on product titles
UPDATE affiliate_links 
SET affiliate_url = 'https://go.dognet.com/?chid=IzDRhdYj&url=https://www.4home.hu/bellatex-frotte-lepedo-vilagos-zold-160-x-200-cm'
WHERE product_id IN (SELECT id FROM products WHERE title ILIKE '%bellatex%frotte%lepedo%');

UPDATE affiliate_links 
SET affiliate_url = 'https://go.dognet.com/?chid=IzDRhdYj&url=https://www.4home.hu/gardinia-mini-relax-redony-sotet-szurke-57-x-150-cm'
WHERE product_id IN (SELECT id FROM products WHERE title ILIKE '%mini%relax%redony%');

UPDATE affiliate_links 
SET affiliate_url = 'https://go.dognet.com/?chid=IzDRhdYj&url=https://www.4home.hu/curver-jute-l-20-l-kosar-taupe'
WHERE product_id IN (SELECT id FROM products WHERE title ILIKE '%curver%jute%kosar%');

UPDATE affiliate_links 
SET affiliate_url = 'https://go.dognet.com/?chid=IzDRhdYj&url=https://www.4home.hu/de-buyer-szilikon-forma-moul-flex-briosky-6-db'
WHERE product_id IN (SELECT id FROM products WHERE title ILIKE '%de buyer%szilikon%forma%');

UPDATE affiliate_links 
SET affiliate_url = 'https://go.dognet.com/?chid=IzDRhdYj&url=https://www.4home.hu/4home-red-hearts-pamut-agynemuhuzat-220-x-200-cm'
WHERE product_id IN (SELECT id FROM products WHERE title ILIKE '%4home%red hearts%pamut%');

-- Map products to appropriate categories
-- Home textiles to home-garden
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'home-garden' AND market_code = 'HU' LIMIT 1)
WHERE market_code = 'HU' AND (title ILIKE '%lepedo%' OR title ILIKE '%agynemuhuzat%' OR title ILIKE '%redony%');

-- Storage and kitchen items to home-living  
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'home-living' AND market_code = 'HU' LIMIT 1)
WHERE market_code = 'HU' AND (title ILIKE '%kosar%' OR title ILIKE '%forma%');