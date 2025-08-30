-- Fix remaining malformed affiliate URLs that weren't caught by the first migration
UPDATE affiliate_links 
SET affiliate_url = REGEXP_REPLACE(
  affiliate_url, 
  'https://restorio\.sk(https%3A%2F%2Fwww\.restorio\.sk%2F)', 
  'https://www.restorio.sk/', 
  'g'
)
WHERE affiliate_url ~ 'restorio\.sk.*restorio\.sk';

-- Enable leaked password protection for better security
UPDATE auth.config 
SET password_policy = password_policy || '{"enable_leaked_password_protection": true}'::jsonb 
WHERE true;