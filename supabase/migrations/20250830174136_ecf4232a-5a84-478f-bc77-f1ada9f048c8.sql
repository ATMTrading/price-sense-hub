-- Fix products step by step to avoid null constraint issues

-- First step: Fix any existing null image URLs
UPDATE products 
SET image_url = '/placeholder.svg'
WHERE image_url IS NULL;

-- Second step: Add descriptions where missing
UPDATE products 
SET description = 'Kvalitná kniha od uznávaného autora. Objavte fascinujúci príbeh plný napätia a emócií.'
WHERE market_code = 'SK' AND (description IS NULL OR description = '');

-- Third step: Fix Restorio image URLs safely - only update if we can extract a proper ISBN
UPDATE products 
SET image_url = 'https://www.restorio.sk/images/big_' || RIGHT(image_url, 13) || '.jpg'
WHERE market_code = 'SK' 
  AND image_url LIKE 'https://www.restorio.sk/%' 
  AND image_url NOT LIKE '%/images/%'
  AND LENGTH(RIGHT(image_url, 13)) = 13
  AND RIGHT(image_url, 13) ~ '^[0-9]+$';