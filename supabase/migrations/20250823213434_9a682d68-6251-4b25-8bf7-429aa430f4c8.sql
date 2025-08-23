-- First, remove the fake Samsung TV product and its affiliate links safely
DELETE FROM affiliate_links WHERE product_id = (SELECT id FROM products WHERE title = 'Samsung TV 55" QLED 4K' AND market_code = 'HU');
DELETE FROM products WHERE title = 'Samsung TV 55" QLED 4K' AND market_code = 'HU';

-- Standardize market codes to uppercase "HU" for all data
UPDATE products SET market_code = 'HU' WHERE market_code = 'hu';
UPDATE shops SET market_code = 'HU' WHERE market_code = 'hu';
UPDATE categories SET market_code = 'HU' WHERE market_code = 'hu';

-- Remove duplicate HU categories that were added earlier
DELETE FROM categories WHERE market_code = 'HU' AND slug IN ('electronics', 'fashion', 'health-beauty', 'home-garden', 'sports', 'baby-kids', 'books-media', 'automotive') AND name IN ('Elektronika', 'Divat és Ruházat', 'Egészség és Szépség', 'Otthon és Kert', 'Sport és Szabadidő', 'Gyermek és Baba', 'Könyv és Média', 'Autó és Motor');

-- Create a general "Home & Living" category for products that don't have specific categories
INSERT INTO categories (name, slug, market_code, is_active) VALUES
('Otthon és Élet', 'home-living', 'HU', true)
ON CONFLICT (slug, market_code) DO NOTHING;

-- Update all products to have the Home & Living category as default
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE slug = 'home-living' AND market_code = 'HU' LIMIT 1)
WHERE market_code = 'HU' AND (category_id IS NULL OR category_id NOT IN (SELECT id FROM categories WHERE market_code = 'HU'));