-- Fix image URLs to use the CDN version for all products
UPDATE products 
SET image_url = REPLACE(image_url, 'https://www.4home.hu/image/catalog/products/product-images/', 'https://cdn.4home.cz/') 
WHERE image_url LIKE 'https://www.4home.hu/image/catalog/products/product-images/%';

-- Ensure we only have the 5 real products and remove any potential duplicates or fake ones
DELETE FROM affiliate_links WHERE product_id NOT IN (
  '66ecda9d-99db-4c8c-bc3c-240558f46f9d',
  '37eb4ff7-c575-4197-af96-967b1271ae91', 
  '9d281ef5-219c-4068-96eb-de91db93dec8',
  '416d5bd7-4c42-4312-a9c2-dbab19d6f036',
  '8f8639d6-5cf5-4064-8796-6852dbb82dc1'
);

DELETE FROM products WHERE id NOT IN (
  '66ecda9d-99db-4c8c-bc3c-240558f46f9d',
  '37eb4ff7-c575-4197-af96-967b1271ae91', 
  '9d281ef5-219c-4068-96eb-de91db93dec8',
  '416d5bd7-4c42-4312-a9c2-dbab19d6f036',
  '8f8639d6-5cf5-4064-8796-6852dbb82dc1'
) OR market_code != 'HU';