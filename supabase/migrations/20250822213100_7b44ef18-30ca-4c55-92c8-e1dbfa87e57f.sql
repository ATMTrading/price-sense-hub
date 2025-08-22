-- Create table for managing XML feeds
CREATE TABLE public.xml_feeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  market_code TEXT NOT NULL,
  feed_type TEXT NOT NULL DEFAULT 'xml', -- xml, csv, json
  mapping_config JSONB DEFAULT '{}', -- field mappings
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_imported_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for affiliate network configurations
CREATE TABLE public.affiliate_networks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  api_endpoint TEXT NOT NULL,
  api_key_name TEXT NOT NULL, -- stored in Supabase secrets
  market_code TEXT NOT NULL,
  config JSONB DEFAULT '{}', -- network-specific configuration
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for import logs
CREATE TABLE public.import_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feed_id UUID REFERENCES public.xml_feeds(id),
  network_id UUID REFERENCES public.affiliate_networks(id),
  import_type TEXT NOT NULL, -- 'xml_feed', 'affiliate_api'
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  products_processed INTEGER DEFAULT 0,
  products_created INTEGER DEFAULT 0,
  products_updated INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.xml_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (since no auth implemented yet)
CREATE POLICY "Anyone can view active XML feeds" 
ON public.xml_feeds 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Anyone can view active affiliate networks" 
ON public.affiliate_networks 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Anyone can view import logs" 
ON public.import_logs 
FOR SELECT 
USING (true);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_xml_feeds_updated_at
BEFORE UPDATE ON public.xml_feeds
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliate_networks_updated_at
BEFORE UPDATE ON public.affiliate_networks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();