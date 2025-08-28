-- Clean up all remaining stuck import logs
DELETE FROM public.import_logs 
WHERE status IN ('running', 'pending', 'processing');