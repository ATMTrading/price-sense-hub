-- Fix market code for existing products
UPDATE products 
SET market_code = 'SK' 
WHERE market_code = 'sk';

-- Fix category assignments for book products to proper book categories
-- Update products with "kniha" (book) in title to proper book category
UPDATE products 
SET category_id = '404a63ee-a181-43ce-8311-82c92f25f81c'
WHERE (title ILIKE '%kniha%' OR title ILIKE '%book%') 
AND market_code = 'SK'
AND category_id = '40df8b4a-3076-4871-9045-bbe82a59deb2';

-- Update children's book products to children's book category  
UPDATE products 
SET category_id = '87956e81-b495-4ece-9532-6ef309f9f90b'
WHERE (title ILIKE '%dětsk%' OR title ILIKE '%detsk%' OR title ILIKE '%children%' OR title ILIKE '%malá kniha%') 
AND market_code = 'SK';