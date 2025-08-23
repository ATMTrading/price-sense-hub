-- Fix affiliate URLs to point to working product pages on 4home.hu
-- Update the problematic affiliate URLs to use the correct product page structure

UPDATE affiliate_links 
SET affiliate_url = CASE
  WHEN product_id = '37eb4ff7-c575-4197-af96-967b1271ae91' THEN 
    'https://go.dognet.com/?chid=IzDRhdYj&url=https%3A%2F%2Fwww.4home.hu%2Fbellatex-frotte-lepedo-vilagos-zold-160-x-200-cm%2F'
  WHEN product_id = '9d281ef5-219c-4068-96eb-de91db93dec8' THEN 
    'https://go.dognet.com/?chid=IzDRhdYj&url=https%3A%2F%2Fwww.4home.hu%2Fgardinia-mini-relax-redony-sotet-szurke-57-x-150-cm%2F'
  WHEN product_id = '416d5bd7-4c42-4312-a9c2-dbab19d6f036' THEN 
    'https://go.dognet.com/?chid=IzDRhdYj&url=https%3A%2F%2Fwww.4home.hu%2Fcurver-jute-l-20-l-kosar-taupe%2F'
  WHEN product_id = '8f8639d6-5cf5-4064-8796-6852dbb82dc1' THEN 
    'https://go.dognet.com/?chid=IzDRhdYj&url=https%3A%2F%2Fwww.4home.hu%2Fde-buyer-szilikon-forma-moul-flex-briosky-6-db%2F'
  ELSE affiliate_url
END
WHERE product_id IN (
  '37eb4ff7-c575-4197-af96-967b1271ae91',
  '9d281ef5-219c-4068-96eb-de91db93dec8', 
  '416d5bd7-4c42-4312-a9c2-dbab19d6f036',
  '8f8639d6-5cf5-4064-8796-6852dbb82dc1'
);