-- Set up Dognet affiliate network for Hungary
INSERT INTO affiliate_networks (id, name, market_code, api_endpoint, api_key_name, config, is_active) VALUES
(
  gen_random_uuid(),
  'Dognet',
  'HU',
  'https://dognet.hu/api', -- Replace with actual Dognet API endpoint
  'DOGNET_API_KEY', -- This will be the secret name
  jsonb_build_object(
    'affiliate_id', 'your_affiliate_id',
    'tracking_param', 'utm_source',
    'base_url', 'https://dognet.hu/redirect'
  ),
  true
)
ON CONFLICT DO NOTHING;

-- Update the XML feed to use proper Dognet affiliate URL template
-- Replace 'YOUR_DOGNET_AFFILIATE_ID' with your actual Dognet affiliate ID
UPDATE xml_feeds 
SET affiliate_link_template = jsonb_build_object(
  'base_url', 'https://dognet.hu/redirect',
  'params', jsonb_build_object(
    'aff_id', 'YOUR_DOGNET_AFFILIATE_ID',
    'url', '{product_url}',
    'utm_source', 'pricecomparise',
    'utm_medium', 'affiliate',
    'utm_campaign', '{market_code}'
  ),
  'url_encode', true
)
WHERE name = '4home' AND market_code = 'HU';