-- Clean up any stuck import logs
DELETE FROM public.import_logs 
WHERE status IN ('running', 'pending', 'processing') 
AND started_at < NOW() - INTERVAL '1 hour';

-- Update the Restorio.sk feed mapping config to fix image URL field
UPDATE public.xml_feeds 
SET mapping_config = jsonb_set(
  mapping_config, 
  '{image_url}', 
  '"g:image_link"'
)
WHERE name = 'Restorio.sk' 
AND is_active = true;