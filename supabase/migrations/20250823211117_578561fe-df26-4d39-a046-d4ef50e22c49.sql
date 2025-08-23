-- Clean up old mock/fake products and keep only real imported products with proper Dognet affiliate links

-- Delete the fake eMAG products (these are mock products, not real imports)
DELETE FROM affiliate_links WHERE product_id IN (
  SELECT p.id FROM products p 
  JOIN shops s ON p.shop_id = s.id 
  WHERE s.name = 'eMAG' AND p.market_code = 'HU'
);

DELETE FROM products WHERE id IN (
  SELECT p.id FROM products p 
  JOIN shops s ON p.shop_id = s.id 
  WHERE s.name = 'eMAG' AND p.market_code = 'HU'
);

-- Delete the fake eMAG shop
DELETE FROM shops WHERE name = 'eMAG' AND market_code = 'HU';

-- Update existing 4home products to use proper Dognet affiliate URLs
-- (The XML import should have already updated these, but let's ensure they're correct)
UPDATE affiliate_links 
SET affiliate_url = 'https://go.dognet.com/?chid=IzDRhdYj&url=' || 
  CASE 
    WHEN p.external_id IS NOT NULL THEN 
      'https://www.4home.hu/product/' || p.external_id || '/'
    ELSE 
      'https://www.4home.hu/'
  END
FROM products p
WHERE affiliate_links.product_id = p.id 
  AND p.shop_id IN (SELECT id FROM shops WHERE name = '4home' AND market_code = 'HU')
  AND affiliate_links.affiliate_url NOT LIKE 'https://go.dognet.com/%';

-- Ensure products have proper category mapping
-- Update products to correct categories based on their titles
UPDATE products 
SET category_id = (
  SELECT id FROM categories 
  WHERE name LIKE '%Electronics%' OR name LIKE '%Elektronika%' 
    AND market_code = 'HU' 
  LIMIT 1
)
WHERE market_code = 'HU' 
  AND shop_id IN (SELECT id FROM shops WHERE name = '4home');

-- Set all remaining real products as featured for better visibility
UPDATE products 
SET is_featured = true 
WHERE market_code = 'HU' 
  AND shop_id IN (SELECT id FROM shops WHERE name = '4home');