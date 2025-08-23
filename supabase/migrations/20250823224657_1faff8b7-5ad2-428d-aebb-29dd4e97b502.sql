-- Fix Red Hearts product - add external_id and optimize image URL
-- Following the same pattern as other products

-- Update Red Hearts product with proper external_id and optimized 500x500 image
UPDATE products 
SET 
  external_id = '4home-red-hearts-pamut-agynemuhuzat',
  image_url = 'https://cdn.4home.cz/de75b193-3020-4085-a8f5-c803ed807b24/500x500/4Home-Red-Hearts-pamut-agynemuhuzat-220-x-200-cm-2-db-70-x-90-cm.jpg'
WHERE id = '66ecda9d-99db-4c8c-bc3c-240558f46f9d';

-- Ensure all products have optimized 500x500 images for consistency
UPDATE products 
SET image_url = 'https://cdn.4home.cz/a7270095-56ed-42e6-9651-fcd63af3d13f/500x500/Curver-Jute-L-20-l-kosar-taupe.jpg'
WHERE id = '416d5bd7-4c42-4312-a9c2-dbab19d6f036' AND image_url NOT LIKE '%/500x500/%';