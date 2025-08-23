-- Make imported products featured so they show on homepage
UPDATE products 
SET is_featured = true 
WHERE market_code = 'hu' 
  AND is_active = true;