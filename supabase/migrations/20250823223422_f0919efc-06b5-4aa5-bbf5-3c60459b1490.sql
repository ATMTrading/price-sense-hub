-- Fix affiliate URLs and product data based on website verification
-- Update products that return 404 to redirect to shop homepage instead
-- Update Curver product price and image URLs with working ones

-- Update affiliate URLs for 404 products to redirect to shop homepage
UPDATE affiliate_links 
SET affiliate_url = 'https://go.dognet.com/?chid=IzDRhdYj&url=https%3A%2F%2Fwww.4home.hu%2F'
WHERE product_id IN (
  '9d281ef5-219c-4068-96eb-de91db93dec8',  -- Mini Relax redőny (404)
  '8f8639d6-5cf5-4064-8796-6852dbb82dc1'   -- De Buyer szilikon forma (404)
);

-- Update Curver product with correct price from website (5035 Ft)
UPDATE products 
SET 
  price = 5035,
  image_url = 'https://cdn.4home.cz/a7270095-56ed-42e6-9651-fcd63af3d13f/500x500/Curver-Jute-L-20-l-kosar-taupe.jpg'
WHERE id = '416d5bd7-4c42-4312-a9c2-dbab19d6f036'; -- Curver Jute kosár

-- Update images for other products with working URLs from the website
UPDATE products 
SET image_url = CASE
  WHEN id = '37eb4ff7-c575-4197-af96-967b1271ae91' THEN 
    'https://cdn.4home.cz/BellaLepedoVilagoszold160x200/BellaLepedoVilagoszold160x200-1.jpg'
  WHEN id = '9d281ef5-219c-4068-96eb-de91db93dec8' THEN 
    'https://cdn.4home.cz/GardiniaMiniRelaxRedony57x150/GardiniaMiniRelaxRedony57x150-1.jpg'  
  WHEN id = '8f8639d6-5cf5-4064-8796-6852dbb82dc1' THEN 
    'https://cdn.4home.cz/DeBuyerSzilikonFormaMoulflexBriosky6db/DeBuyerSzilikonFormaMoulflexBriosky6db-1.jpg'
  ELSE image_url
END
WHERE id IN (
  '37eb4ff7-c575-4197-af96-967b1271ae91',
  '9d281ef5-219c-4068-96eb-de91db93dec8',
  '8f8639d6-5cf5-4064-8796-6852dbb82dc1'
);