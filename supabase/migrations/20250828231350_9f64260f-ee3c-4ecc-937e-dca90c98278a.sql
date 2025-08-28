-- Fix the mapping config for the Restorio feed to use correct field mappings
UPDATE xml_feeds 
SET mapping_config = '{
  "isbn": "g:gtin",
  "price": "g:price", 
  "title": "title",
  "category": "g:google_product_category",
  "image_url": "g:image_link",
  "publisher": "g:brand",
  "description": "g:description", 
  "external_id": "g:id",
  "availability": "g:availability",
  "original_price": "g:price",
  "category_mapping": {
    "784": "280128fb-cc33-4fae-8e43-a8c5bc949ea5"
  }
}'::jsonb
WHERE url = 'https://yaby.eu/pythonProject/projekt/antik/feedy_tvorba_antik/trhknih/dognetsk.xml';

-- Update import status for stuck imports to failed status
UPDATE import_logs 
SET status = 'failed',
    completed_at = now(),
    errors = ARRAY['Import timeout - automatically marked as failed']
WHERE status = 'processing' 
AND started_at < now() - interval '10 minutes';