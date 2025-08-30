-- Fix malformed affiliate URLs and update product categories
-- Step 1: Clean up malformed affiliate URLs for Restorio.sk
UPDATE affiliate_links 
SET affiliate_url = REPLACE(affiliate_url, 'https://restorio.skhttps%3A%2F%2Fwww.restorio.sk%2F', 'https://www.restorio.sk/')
WHERE affiliate_url LIKE '%restorio.skhttps%3A%2F%2Fwww.restorio.sk%2F%';

-- Step 2: Update products from old "Knihy" category to correct "Knihy a Médiá" category  
UPDATE products 
SET category_id = 'ae064a70-5e9b-495a-9c9f-e1640b5803af'
WHERE category_id = '404a63ee-a181-43ce-8311-82c92f25f81c' 
  AND market_code = 'SK';

-- Step 3: Remove the old unused category to prevent confusion
DELETE FROM categories 
WHERE id = '404a63ee-a181-43ce-8311-82c92f25f81c' 
  AND slug = 'books' 
  AND name = 'Knihy';