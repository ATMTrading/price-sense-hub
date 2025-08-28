-- Clean up duplicate feeds and failed import logs
DELETE FROM public.xml_feeds 
WHERE name = 'Restorio.sk' 
AND is_active = false;

-- Clear failed import logs to start fresh
DELETE FROM public.import_logs 
WHERE status = 'failed' 
AND import_type = 'test_import';