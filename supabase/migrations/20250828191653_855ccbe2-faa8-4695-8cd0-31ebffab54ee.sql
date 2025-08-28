-- Add affiliate_params column to shops table to store shop-specific affiliate parameters
ALTER TABLE public.shops 
ADD COLUMN affiliate_params JSONB DEFAULT '{}'::jsonb;

-- Update Restorio.sk shop with dognet utm_source
UPDATE public.shops 
SET affiliate_params = '{"utm_source": "dognet", "a_cid": "908fbcd7"}'::jsonb
WHERE name ILIKE '%restorio%' OR website_url ILIKE '%restorio%';

-- Update Valachshop.sk shop with dgt utm_source  
UPDATE public.shops 
SET affiliate_params = '{"utm_source": "dgt", "a_cid": "fbf8d048"}'::jsonb
WHERE name ILIKE '%valach%' OR website_url ILIKE '%valach%';

-- Create index for better performance on affiliate_params queries
CREATE INDEX IF NOT EXISTS idx_shops_affiliate_params ON public.shops USING GIN (affiliate_params);