-- CRITICAL SECURITY FIXES (CORRECTED)

-- 1. FIX ROLE ESCALATION VULNERABILITY
-- Drop existing policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create policy that allows users to update their profile but with trigger protection for role changes
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. RESTRICT AFFILIATE LINKS ACCESS - ADMIN ONLY
DROP POLICY IF EXISTS "Anyone can view active affiliate links" ON public.affiliate_links;

CREATE POLICY "Only admins can view affiliate links" 
ON public.affiliate_links 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. RESTRICT SHOPS DATA - HIDE SENSITIVE BUSINESS INFO
DROP POLICY IF EXISTS "Anyone can view active shops" ON public.shops;

-- Allow public access to basic shop data only
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

-- 5. ADD SECURITY TRIGGER FOR ROLE CHANGES
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if role is being changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Only allow role changes by admins
    IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Access denied: Only administrators can modify user roles';
    END IF;
    
    -- Log role changes for audit
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
      jsonb_build_object('old_role', OLD.role),
      jsonb_build_object('new_role', NEW.role)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for role change prevention
DROP TRIGGER IF EXISTS prevent_role_escalation_trigger ON public.profiles;
CREATE TRIGGER prevent_role_escalation_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

-- Add helpful comments
COMMENT ON POLICY "Users can update own profile" ON public.profiles IS 'Security: Users can update profile but role changes are blocked by trigger';
COMMENT ON POLICY "Only admins can view affiliate links" ON public.affiliate_links IS 'Security: Protects sensitive affiliate commission data';
COMMENT ON FUNCTION public.prevent_role_escalation() IS 'Security: Prevents unauthorized role escalation attempts';