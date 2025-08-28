-- Create a test import log to trigger the process
INSERT INTO import_logs (
  id,
  import_type,
  status,
  feed_id,
  started_at,
  products_processed,
  products_created,
  products_updated
) VALUES (
  gen_random_uuid(),
  'test_import',
  'pending',
  'b00199e7-a680-497f-972c-28c74d6fc594',
  now(),
  0,
  0,
  0
);