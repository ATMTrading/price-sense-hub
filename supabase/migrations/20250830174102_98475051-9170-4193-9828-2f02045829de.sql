-- Handle products with null image_url first
UPDATE products 
SET image_url = '/placeholder.svg'
WHERE image_url IS NULL;

-- Fix Restorio image URLs with proper ISBN extraction
UPDATE products 
SET 
  image_url = CASE 
    WHEN image_url LIKE 'https://www.restorio.sk/%' AND image_url NOT LIKE '%/images/%'
    THEN 'https://www.restorio.sk/images/big_' || SUBSTRING(image_url FROM '([0-9]{13})$') || '.jpg'
    ELSE image_url 
  END
WHERE market_code = 'SK' AND image_url LIKE 'https://www.restorio.sk/%' AND image_url NOT LIKE '%/images/%';

-- Add descriptions for all products without descriptions
UPDATE products 
SET description = 'Kvalitná kniha od uznávaného autora. Objavte fascinujúci príbeh plný napätia a emócií.'
WHERE market_code = 'SK' AND (description IS NULL OR description = '');