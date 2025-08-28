-- Update Restorio.sk feed with correct affiliate link template containing UTM parameters
UPDATE xml_feeds 
SET affiliate_link_template = jsonb_build_object(
  'base_url', 'https://restorio.sk',
  'url_encode', true,
  'append_product_url', true,
  'utm_params', jsonb_build_object(
    'utm_source', 'dognet',
    'utm_medium', 'affiliate', 
    'utm_campaign', '68b053b92fff1'
  )
)
WHERE name = 'Restorio.sk' AND market_code = 'SK';