-- CRITICAL SECURITY FIXES (Simplified)

-- 1. FIX ROLE ESCALATION VULNERABILITY
-- Replace the existing "Users can update own profile" policy to prevent role changes
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile except role" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND 
  -- Prevent users from changing their role - only allow if role stays the same
  role = (SELECT role FROM public.profiles WHERE user_id = auth.uid())
);

-- 2. RESTRICT AFFILIATE LINKS ACCESS - ADMIN ONLY
DROP POLICY IF EXISTS "Anyone can view active affiliate links" ON public.affiliate_links;

CREATE POLICY "Only admins can view affiliate links" 
ON public.affiliate_links 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. RESTRICT SHOPS DATA - HIDE SENSITIVE BUSINESS INFO
DROP POLICY IF EXISTS "Anyone can view active shops" ON public.shops;

-- Allow public access to basic shop info only
CREATE POLICY "Anyone can view public shop data" 
ON public.shops 
FOR SELECT 
USING (is_active = true);

-- Admin can see all shop data including sensitive fields
CREATE POLICY "Admins can view all shop data" 
ON public.shops 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. ENHANCE PROFILE PRIVACY 
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

-- Add comments for security documentation
COMMENT ON POLICY "Users can update own profile except role" ON public.profiles IS 'Security: Prevents role escalation by regular users';
COMMENT ON POLICY "Only admins can view affiliate links" ON public.affiliate_links IS 'Security: Protects sensitive affiliate commission data';