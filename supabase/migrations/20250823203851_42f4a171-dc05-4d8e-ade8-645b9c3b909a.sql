-- Create sample data for HU market
INSERT INTO shops (id, name, market_code, website_url, is_active) VALUES
  (gen_random_uuid(), '4home', 'HU', 'https://4home.hu', true),
  (gen_random_uuid(), 'eMAG', 'HU', 'https://emag.hu', true)
ON CONFLICT DO NOTHING;

INSERT INTO categories (id, name, slug, market_code, is_active) VALUES
  (gen_random_uuid(), 'Elektronika', 'electronics', 'HU', true),
  (gen_random_uuid(), 'Otthon és Kert', 'home-garden', 'HU', true)
ON CONFLICT DO NOTHING;

-- Insert sample products if none exist for HU market
INSERT INTO products (
  id, title, image_url, price, original_price, currency, market_code,
  shop_id, category_id, is_featured, is_active, availability, rating, review_count
)
SELECT 
  gen_random_uuid(),
  'Samsung TV 55" QLED 4K',
  'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop',
  299990,
  349990,
  'HUF',
  'HU',
  s.id,
  c.id,
  true,
  true,
  'in_stock',
  4.5,
  123
FROM shops s, categories c 
WHERE s.market_code = 'HU' AND c.market_code = 'HU' 
  AND s.name = '4home' AND c.slug = 'electronics'
  AND NOT EXISTS (SELECT 1 FROM products WHERE market_code = 'HU')
LIMIT 1;

INSERT INTO products (
  id, title, image_url, price, original_price, currency, market_code,
  shop_id, category_id, is_featured, is_active, availability, rating, review_count
)
SELECT 
  gen_random_uuid(),
  'iPhone 15 Pro 256GB',
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop',
  449990,
  499990,
  'HUF',
  'HU',
  s.id,
  c.id,
  true,
  true,
  'in_stock',
  4.8,
  567
FROM shops s, categories c 
WHERE s.market_code = 'HU' AND c.market_code = 'HU' 
  AND s.name = 'eMAG' AND c.slug = 'electronics'
  AND EXISTS (SELECT 1 FROM products WHERE market_code = 'HU')
LIMIT 1;

-- Create affiliate links for the products
INSERT INTO affiliate_links (id, product_id, affiliate_url, tracking_code, is_active)
SELECT 
  gen_random_uuid(),
  p.id,
  'https://4home.hu/product/' || p.id,
  'track_' || SUBSTR(p.id::text, 1, 8),
  true
FROM products p
WHERE p.market_code = 'HU' AND NOT EXISTS (
  SELECT 1 FROM affiliate_links WHERE product_id = p.id
);