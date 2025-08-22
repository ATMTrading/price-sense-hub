-- Fix the get_scheduled_jobs function with correct pg_cron column names
CREATE OR REPLACE FUNCTION public.get_scheduled_jobs()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', jobid,
      'name', jobname,
      'schedule', schedule,
      'command', command,
      'is_active', active,
      'job_type', 'scheduled_import',
      'last_run', null,
      'next_run', null
    )
  ) INTO result
  FROM cron.job
  WHERE jobname IS NOT NULL;

  RETURN COALESCE(result, '[]'::jsonb);
EXCEPTION
  WHEN OTHERS THEN
    RETURN '[]'::jsonb;
END;
$$;