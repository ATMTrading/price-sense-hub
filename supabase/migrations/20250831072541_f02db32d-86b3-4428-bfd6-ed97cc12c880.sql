-- Remove rating and review_count columns from products table
ALTER TABLE public.products 
DROP COLUMN IF EXISTS rating,
DROP COLUMN IF EXISTS review_count;