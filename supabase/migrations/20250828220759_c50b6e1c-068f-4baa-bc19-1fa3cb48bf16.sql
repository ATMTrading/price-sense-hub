UPDATE xml_feeds 
SET affiliate_link_template = '{
  "base_url": "https://restorio.sk/",
  "url_encode": true,
  "utm_params": {
    "utm_source": "dognet",
    "utm_medium": "affiliate", 
    "utm_campaign": "68b053b92fff1",
    "a_aid": "68b053b92fff1",
    "a_cid": "908fbcd7",
    "chan": "KZKBlu6j"
  },
  "append_product_url": true
}'::jsonb
WHERE name = 'Restorio.sk' AND market_code = 'sk';