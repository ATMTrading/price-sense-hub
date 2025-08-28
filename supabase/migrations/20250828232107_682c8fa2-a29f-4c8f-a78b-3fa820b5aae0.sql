-- Clean up in correct order: delete import logs first, then feeds
DELETE FROM public.import_logs 
WHERE feed_id IN (
  SELECT id FROM public.xml_feeds 
  WHERE name = 'Restorio.sk' 
  AND is_active = false
);

-- Now delete the duplicate inactive feeds
DELETE FROM public.xml_feeds 
WHERE name = 'Restorio.sk' 
AND is_active = false;

-- Clear remaining failed import logs to start fresh
DELETE FROM public.import_logs 
WHERE status = 'failed';