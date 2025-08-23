-- Fix remaining product issues: prices, images, and affiliate URLs
-- Update products with correct data from 4home.hu feed

-- Update Bellatex product - correct price and working image URL
UPDATE products 
SET 
  price = 2690,
  image_url = 'https://cdn.4home.cz/BellaLepedoVilagoszold160x200/BellaLepedoVilagoszold160x200-1.jpg'
WHERE id = '37eb4ff7-c575-4197-af96-967b1271ae91';

-- Update Mini Relax product - correct price and working image URL  
UPDATE products 
SET 
  price = 1990,
  image_url = 'https://cdn.4home.cz/GardiniaMiniRelaxRedony57x150/GardiniaMiniRelaxRedony57x150-1.jpg'
WHERE id = '9d281ef5-219c-4068-96eb-de91db93dec8';

-- Update De Buyer product - correct price and working image URL
UPDATE products 
SET 
  price = 4490,
  image_url = 'https://cdn.4home.cz/DeBuyerSzilikonFormaMoulflexBriosky6db/DeBuyerSzilikonFormaMoulflexBriosky6db-1.jpg'
WHERE id = '8f8639d6-5cf5-4064-8796-6852dbb82dc1';

-- Update affiliate URLs to point to specific product pages instead of homepage
UPDATE affiliate_links 
SET affiliate_url = CASE
  WHEN product_id = '37eb4ff7-c575-4197-af96-967b1271ae91' THEN 
    'https://go.dognet.com/?chid=IzDRhdYj&url=https%3A%2F%2Fwww.4home.hu%2Fbellatex-frotte-lepedo-vilagos-zold-160-x-200-cm%2F'
  WHEN product_id = '9d281ef5-219c-4068-96eb-de91db93dec8' THEN 
    'https://go.dognet.com/?chid=IzDRhdYj&url=https%3A%2F%2Fwww.4home.hu%2Fgardinia-mini-relax-redony-sotet-szurke-57-x-150-cm%2F'
  WHEN product_id = '8f8639d6-5cf5-4064-8796-6852dbb82dc1' THEN 
    'https://go.dognet.com/?chid=IzDRhdYj&url=https%3A%2F%2Fwww.4home.hu%2Fde-buyer-szilikon-forma-moul-flex-briosky-6-db%2F'
  ELSE affiliate_url
END
WHERE product_id IN (
  '37eb4ff7-c575-4197-af96-967b1271ae91',
  '9d281ef5-219c-4068-96eb-de91db93dec8', 
  '8f8639d6-5cf5-4064-8796-6852dbb82dc1'
);