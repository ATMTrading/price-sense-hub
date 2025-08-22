-- Add external_id column to products table for tracking external IDs from APIs
ALTER TABLE public.products ADD COLUMN external_id TEXT;