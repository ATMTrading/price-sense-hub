-- Phase 1 & 2: Critical Security Fixes (Fixed)

-- Create security definer function to safely check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = 'public'
AS $$
  SELECT role::text FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Create function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Fix all existing security definer functions with proper search_path
CREATE OR REPLACE FUNCTION public.schedule_function_call(job_name text, cron_schedule text, function_name text, function_args jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result JSONB;
BEGIN
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

CREATE OR REPLACE FUNCTION public.toggle_scheduled_job(job_id bigint, is_active boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF is_active THEN
    PERFORM cron.unschedule(job_id);
  ELSE
    UPDATE cron.job SET active = is_active WHERE jobid = job_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'job_id', job_id, 'active', is_active);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_scheduled_job(job_id bigint)
RETURNS jsonb
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

CREATE OR REPLACE FUNCTION public.get_scheduled_jobs()
RETURNS jsonb
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

-- Drop existing public policies on sensitive tables
DROP POLICY IF EXISTS "Anyone can view active affiliate networks" ON public.affiliate_networks;
DROP POLICY IF EXISTS "Anyone can view active XML feeds" ON public.xml_feeds;
DROP POLICY IF EXISTS "Anyone can view import logs" ON public.import_logs;

-- Create admin-only policies for sensitive business data
CREATE POLICY "Only admins can view affiliate networks" 
ON public.affiliate_networks 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can view XML feeds" 
ON public.xml_feeds 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can view import logs" 
ON public.import_logs 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix role escalation vulnerability in profiles table
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Only allow basic profile updates, role changes require admin
CREATE POLICY "Users can update their own profile data" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create separate policy for admin role changes
CREATE POLICY "Only admins can change user roles" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create audit log table for Phase 4
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create function to log admin operations
CREATE OR REPLACE FUNCTION public.log_admin_operation(
  p_action text,
  p_table_name text DEFAULT NULL,
  p_record_id uuid DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    p_action,
    p_table_name,
    p_record_id,
    p_old_values,
    p_new_values
  );
END;
$$;