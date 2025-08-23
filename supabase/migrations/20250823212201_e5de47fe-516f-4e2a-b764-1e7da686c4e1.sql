-- Create all main categories for Hungarian market
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

-- Check if there are other products that should be featured
UPDATE products 
SET is_featured = true 
WHERE market_code = 'HU' 
AND is_active = true 
AND shop_id = (SELECT id FROM shops WHERE name = '4home' LIMIT 1);

-- Make sure products have proper affiliate links
UPDATE products p
SET updated_at = now()
WHERE p.market_code = 'HU' 
AND p.is_active = true
AND EXISTS (
  SELECT 1 FROM affiliate_links al 
  WHERE al.product_id = p.id 
  AND al.is_active = true
);