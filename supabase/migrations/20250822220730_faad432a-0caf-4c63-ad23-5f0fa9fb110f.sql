-- Fix security issues by setting search_path for functions

-- Update schedule_function_call function with proper search_path
CREATE OR REPLACE FUNCTION public.schedule_function_call(
  job_name TEXT,
  cron_schedule TEXT,
  function_name TEXT,
  function_args JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Use pg_cron to schedule the function call
  PERFORM cron.schedule(
    job_name,
    cron_schedule,
    format(
      'SELECT net.http_post(url:=''%s/functions/v1/%s'', headers:=''{"Content-Type": "application/json", "Authorization": "Bearer %s"}''::jsonb, body:=''%s''::jsonb) as request_id;',
      current_setting('app.supabase_url', true),
      function_name,
      current_setting('app.supabase_anon_key', true),
      function_args::text
    )
  );

  -- Return success response
  result := jsonb_build_object(
    'success', true,
    'job_name', job_name,
    'schedule', cron_schedule,
    'function_name', function_name
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Update get_scheduled_jobs function with proper search_path
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
      'last_run', last_run_start_time,
      'next_run', next_run_start_time
    )
  ) INTO result
  FROM cron.job
  WHERE jobname LIKE '%function-call%';

  RETURN COALESCE(result, '[]'::jsonb);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Update toggle_scheduled_job function with proper search_path
CREATE OR REPLACE FUNCTION public.toggle_scheduled_job(
  job_id BIGINT,
  is_active BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER  
SET search_path = 'public'
AS $$
BEGIN
  IF is_active THEN
    PERFORM cron.unschedule(job_id);
  ELSE
    -- Re-enable the job (this would need the original schedule)
    -- For now, we'll just update the active status
    UPDATE cron.job SET active = is_active WHERE jobid = job_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'job_id', job_id, 'active', is_active);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Update delete_scheduled_job function with proper search_path
CREATE OR REPLACE FUNCTION public.delete_scheduled_job(
  job_id BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  PERFORM cron.unschedule(job_id);
  
  RETURN jsonb_build_object('success', true, 'job_id', job_id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;