-- Update the XML feed to use correct Dognet affiliate URL template
UPDATE xml_feeds 
SET affiliate_link_template = jsonb_build_object(
  'base_url', 'https://go.dognet.com/',
  'params', jsonb_build_object(
    'chid', 'IzDRhdYj',
    'url', '{product_url}'
  ),
  'url_encode', true
)
WHERE name = '4home' AND market_code = 'HU';