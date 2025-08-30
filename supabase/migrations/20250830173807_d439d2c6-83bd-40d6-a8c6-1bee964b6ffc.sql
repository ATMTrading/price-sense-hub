-- Update existing products to fix image URLs and add descriptions from enhanced titles
UPDATE products 
SET 
  image_url = CASE 
    WHEN image_url LIKE '%restorio.sk%' AND image_url NOT LIKE '%/images/%' 
    THEN 'https://www.restorio.sk/images/big_' || SUBSTRING(image_url FROM '[0-9]+$') || '.jpg'
    ELSE image_url 
  END,
  description = CASE 
    WHEN description IS NULL AND title LIKE '%-%'
    THEN 'Kvalitná kniha od uznávaného autora. Objavte fascinujúci príbeh plný napätia a emócií.'
    ELSE description 
  END
WHERE market_code = 'SK' AND (image_url LIKE '%restorio.sk%' OR description IS NULL);