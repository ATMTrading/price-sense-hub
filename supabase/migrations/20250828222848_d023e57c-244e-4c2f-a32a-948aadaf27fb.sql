-- Reactivate the correct Restorio.sk feed and remove the old one
-- First, reactivate the feed with the correct affiliate template structure (utm_params)
UPDATE xml_feeds 
SET is_active = true 
WHERE name = 'Restorio.sk' 
  AND affiliate_link_template->>'utm_source' IS NOT NULL;

-- Delete the old feed with the outdated affiliate template structure (parameters)
DELETE FROM xml_feeds 
WHERE name = 'Restorio.sk' 
  AND affiliate_link_template->>'parameters' IS NOT NULL;