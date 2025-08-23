-- Update the XML feed with proper affiliate tracking
UPDATE xml_feeds 
SET 
  mapping_config = jsonb_build_object(
    'title', 'name',
    'price', 'price', 
    'shop', 'manufacturer',
    'category', 'category',
    'description', 'description',
    'image_url', 'image_url',
    'product_url', 'product_url',
    'external_id', 'identifier'
  ),
  affiliate_link_template = jsonb_build_object(
    'base_url', 'https://your-tracking-domain.com/track',
    'url_encode', true,
    'params', jsonb_build_object(
      'url', '{product_url}',
      'source', 'pricecomparise',
      'market', '{market_code}'
    )
  )
WHERE market_code = 'hu' AND is_active = true;

-- Also create affiliate links for existing products using their original URLs from description
INSERT INTO affiliate_links (product_id, affiliate_url, is_active, tracking_code)
SELECT 
  p.id,
  CASE 
    WHEN p.description ~ '<product_url>' THEN
      'https://your-tracking-domain.com/track?url=' || 
      encode(regexp_replace(p.description, '.*<product_url>(.*?)</product_url>.*', '\1', 's')::bytea, 'base64') ||
      '&source=pricecomparise&market=' || p.market_code
    ELSE 'https://example.com/not-configured'
  END,
  true,
  'PC_' || substr(md5(random()::text), 1, 8)
FROM products p
WHERE p.market_code = 'hu' 
  AND p.is_active = true
  AND NOT EXISTS (SELECT 1 FROM affiliate_links al WHERE al.product_id = p.id);