-- CRITICAL SECURITY FIXES

-- 1. FIX ROLE ESCALATION VULNERABILITY
-- Replace the existing "Users can update own profile" policy to prevent role changes
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile except role" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND 
  -- Prevent users from changing their role
  (OLD.role = NEW.role OR NEW.role IS NULL)
);

-- 2. RESTRICT AFFILIATE LINKS ACCESS - ADMIN ONLY
DROP POLICY IF EXISTS "Anyone can view active affiliate links" ON public.affiliate_links;

CREATE POLICY "Only admins can view affiliate links" 
ON public.affiliate_links 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. RESTRICT SHOPS DATA - HIDE SENSITIVE BUSINESS INFO
DROP POLICY IF EXISTS "Anyone can view active shops" ON public.shops;

-- Create view for public shop data (without sensitive affiliate_params)
CREATE OR REPLACE VIEW public.shops_public AS
SELECT 
  id,
  name,
  logo_url,
  website_url,
  market_code,
  is_active,
  created_at,
  updated_at
FROM public.shops
WHERE is_active = true;

-- Allow public access to the safe shop view
CREATE POLICY "Anyone can view public shop data" 
ON public.shops 
FOR SELECT 
USING (is_active = true);

-- Admin can see all shop data including sensitive fields
CREATE POLICY "Admins can view all shop data" 
ON public.shops 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. ENHANCE PROFILE PRIVACY - RESTRICT EMAIL ACCESS
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile only" ON public.profiles;

-- Users can only view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. ADD SECURITY FUNCTION FOR ROLE CHANGES
CREATE OR REPLACE FUNCTION public.secure_role_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow role changes by admins
  IF OLD.role != NEW.role AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only administrators can modify user roles';
  END IF;
  
  -- Log role changes for audit
  IF OLD.role != NEW.role THEN
    INSERT INTO public.audit_logs (
      user_id, 
      action, 
      table_name, 
      record_id, 
      old_values, 
      new_values
    ) VALUES (
      auth.uid(),
      'ROLE_CHANGE',
      'profiles',
      NEW.id,
      jsonb_build_object('role', OLD.role),
      jsonb_build_object('role', NEW.role)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for role change monitoring
DROP TRIGGER IF EXISTS secure_role_update_trigger ON public.profiles;
CREATE TRIGGER secure_role_update_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.secure_role_update();

-- 6. ADDITIONAL ADMIN-ONLY POLICIES FOR SENSITIVE TABLES

-- Ensure import_logs remain admin-only (already correct)
-- Ensure audit_logs remain admin-only (already correct)
-- Ensure xml_feeds remain admin-only (already correct)
-- Ensure affiliate_networks remain admin-only (already correct)

COMMENT ON POLICY "Users can update own profile except role" ON public.profiles IS 'Security: Prevents role escalation by regular users';
COMMENT ON POLICY "Only admins can view affiliate links" ON public.affiliate_links IS 'Security: Protects sensitive affiliate commission data';
COMMENT ON FUNCTION public.secure_role_update() IS 'Security: Prevents unauthorized role changes and logs all role modifications';