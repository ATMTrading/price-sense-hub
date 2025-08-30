-- Move all remaining products from generic category to proper book categories
UPDATE products 
SET category_id = '404a63ee-a181-43ce-8311-82c92f25f81c' -- Books category ID
WHERE market_code = 'SK' 
  AND category_id = '40df8b4a-3076-4871-9045-bbe82a59deb2'
  AND (title ILIKE '%kniha%' OR title ILIKE '%book%');

-- Move children's books to children's book category
UPDATE products 
SET category_id = '87956e81-b495-4ece-9532-6ef309f9f90b' -- Children's Books category ID
WHERE market_code = 'SK' 
  AND (title ILIKE '%dětsk%' OR title ILIKE '%detsk%' OR title ILIKE '%children%' OR title ILIKE '%malá kniha%');