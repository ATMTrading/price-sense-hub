-- Add affiliate link template configuration to xml_feeds table
ALTER TABLE public.xml_feeds 
ADD COLUMN affiliate_link_template jsonb DEFAULT '{}'::jsonb;

-- Add comment to explain the structure
COMMENT ON COLUMN public.xml_feeds.affiliate_link_template IS 'Template for generating affiliate links. Example: {"base_url": "https://go.dognet.com/?chid=IzDRhdYj&url=", "url_encode": true}';