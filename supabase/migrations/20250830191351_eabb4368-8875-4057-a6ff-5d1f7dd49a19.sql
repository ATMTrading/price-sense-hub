-- Fix affiliate links by adding sample data for testing
INSERT INTO affiliate_links (product_id, affiliate_url, tracking_code, is_active) 
SELECT 
  p.id,
  CASE 
    WHEN s.name = 'Restorio.sk' THEN 'https://www.restorio.sk?utm_source=dognet&utm_medium=affiliate&utm_campaign=68b053b92fff1'
    ELSE s.website_url || '?ref=bestpric'
  END as affiliate_url,
  'default_tracking' as tracking_code,
  true as is_active
FROM products p 
JOIN shops s ON p.shop_id = s.id 
WHERE p.is_active = true 
AND NOT EXISTS (SELECT 1 FROM affiliate_links al WHERE al.product_id = p.id)
LIMIT 100;