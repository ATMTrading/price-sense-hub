-- Fix affiliate URLs to use proper format and URL encoding
UPDATE affiliate_links 
SET affiliate_url = 'https://go.dognet.com/?chid=IzDRhdYj&url=https%3A%2F%2Fwww.4home.hu%2F4home-red-hearts-pamut-agynemuhuzat--220-x-200-cm-2-db-70-x-90-cm%2F'
WHERE product_id = '66ecda9d-99db-4c8c-bc3c-240558f46f9d';

UPDATE affiliate_links 
SET affiliate_url = 'https://go.dognet.com/?chid=IzDRhdYj&url=https%3A%2F%2Fwww.4home.hu%2Fbellatex-frotte-lepedo-vilagos-zold--160-x-200-cm%2F'
WHERE product_id = '37eb4ff7-c575-4197-af96-967b1271ae91';

UPDATE affiliate_links 
SET affiliate_url = 'https://go.dognet.com/?chid=IzDRhdYj&url=https%3A%2F%2Fwww.4home.hu%2Fgardinia-mini-relax-redony-sotet-szurke--57-x-150-cm%2F'
WHERE product_id = '9d281ef5-219c-4068-96eb-de91db93dec8';

UPDATE affiliate_links 
SET affiliate_url = 'https://go.dognet.com/?chid=IzDRhdYj&url=https%3A%2F%2Fwww.4home.hu%2Fcurver-jute-l-20-l-kosar--taupe%2F'
WHERE product_id = '416d5bd7-4c42-4312-a9c2-dbab19d6f036';

UPDATE affiliate_links 
SET affiliate_url = 'https://go.dognet.com/?chid=IzDRhdYj&url=https%3A%2F%2Fwww.4home.hu%2Fde-buyer-szilikon-forma-moul-flex-briosky--6-db%2F'
WHERE product_id = '8f8639d6-5cf5-4064-8796-6852dbb82dc1';

-- Create categories for other markets (SK, PL, CZ, RO)
INSERT INTO categories (name, slug, market_code, is_active) VALUES
-- Slovak market categories
('Elektronika', 'electronics', 'SK', true),
('Móda a Oblečenie', 'fashion', 'SK', true),
('Zdravie a Krása', 'health-beauty', 'SK', true),
('Domov a Záhrada', 'home-garden', 'SK', true),
('Šport a Voľný čas', 'sports', 'SK', true),
('Deti a Bábätká', 'baby-kids', 'SK', true),
('Knihy a Médiá', 'books-media', 'SK', true),
('Auto a Motocykle', 'automotive', 'SK', true),

-- Polish market categories
('Elektronika', 'electronics', 'PL', true),
('Moda i Odzież', 'fashion', 'PL', true),
('Zdrowie i Uroda', 'health-beauty', 'PL', true),
('Dom i Ogród', 'home-garden', 'PL', true),
('Sport i Wypoczynek', 'sports', 'PL', true),
('Dzieci i Niemowlęta', 'baby-kids', 'PL', true),
('Książki i Media', 'books-media', 'PL', true),
('Motoryzacja', 'automotive', 'PL', true),

-- Czech market categories
('Elektronika', 'electronics', 'CZ', true),
('Móda a Oblečení', 'fashion', 'CZ', true),
('Zdraví a Krása', 'health-beauty', 'CZ', true),
('Domov a Zahrada', 'home-garden', 'CZ', true),
('Sport a Volný čas', 'sports', 'CZ', true),
('Děti a Miminka', 'baby-kids', 'CZ', true),
('Knihy a Média', 'books-media', 'CZ', true),
('Automotive', 'automotive', 'CZ', true),

-- Romanian market categories
('Electronice', 'electronics', 'RO', true),
('Modă și Îmbrăcăminte', 'fashion', 'RO', true),
('Sănătate și Frumusețe', 'health-beauty', 'RO', true),
('Casă și Grădină', 'home-garden', 'RO', true),
('Sport și Recreere', 'sports', 'RO', true),
('Copii și Bebeluși', 'baby-kids', 'RO', true),
('Cărți și Media', 'books-media', 'RO', true),
('Automotive', 'automotive', 'RO', true);

-- Delete any potential fake/test products that don't belong to real shops
DELETE FROM affiliate_links WHERE product_id IN (
  SELECT p.id FROM products p 
  LEFT JOIN shops s ON p.shop_id = s.id 
  WHERE s.name IS NULL OR s.name NOT IN ('4Home')
);

DELETE FROM products WHERE shop_id NOT IN (
  SELECT id FROM shops WHERE name = '4Home'
) OR title LIKE '%Test%' OR title LIKE '%Fake%' OR title LIKE '%Sample%';