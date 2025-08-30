-- First, fix products with null image_url by giving them a placeholder
UPDATE products 
SET image_url = '/placeholder.svg'
WHERE image_url IS NULL;

-- Then update Restorio image URLs and add descriptions
UPDATE products 
SET 
  image_url = CASE 
    WHEN image_url LIKE '%restorio.sk%' AND image_url NOT LIKE '%/images/%' 
    THEN 'https://www.restorio.sk/images/big_' || SUBSTRING(image_url FROM '[0-9]+$') || '.jpg'
    ELSE image_url 
  END,
  description = CASE 
    WHEN description IS NULL 
    THEN 'Kvalitná kniha od uznávaného autora. Objavte fascinujúci príbeh plný napätia a emócií.'
    ELSE description 
  END
WHERE market_code = 'SK';