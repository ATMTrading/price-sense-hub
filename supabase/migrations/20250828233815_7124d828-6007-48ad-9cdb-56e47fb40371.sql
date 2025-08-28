-- Fix the XML feed mapping configuration for image_url
UPDATE xml_feeds 
SET mapping_config = jsonb_set(
  mapping_config, 
  '{image_url}', 
  '"g:image_link"'::jsonb
) 
WHERE id = 'b00199e7-a680-497f-972c-28c74d6fc594';

-- Also ensure we have a proper affiliate link template
UPDATE xml_feeds 
SET affiliate_link_template = jsonb_build_object(
  'base_url', 'https://restorio.sk/',
  'url_encode', true,
  'utm_params', jsonb_build_object(
    'utm_source', 'dognet',
    'utm_medium', 'affiliate', 
    'utm_campaign', '68b053b92fff1'
  ),
  'append_product_url', true
)
WHERE id = 'b00199e7-a680-497f-972c-28c74d6fc594';