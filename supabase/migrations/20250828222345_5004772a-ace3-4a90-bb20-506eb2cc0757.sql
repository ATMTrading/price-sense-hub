-- Clean up duplicate Restorio.sk feeds and keep only the correct one
DELETE FROM xml_feeds 
WHERE name = 'Restorio.sk' 
AND id NOT IN (
  SELECT id FROM xml_feeds 
  WHERE name = 'Restorio.sk' 
  AND affiliate_link_template->'utm_params'->>'utm_source' = 'dognet'
  AND affiliate_link_template->'utm_params'->>'utm_medium' = 'affiliate'
  AND affiliate_link_template->'utm_params'->>'utm_campaign' = '68b053b92fff1'
  ORDER BY created_at DESC 
  LIMIT 1
);