-- Create Restorio.sk shop entry
INSERT INTO public.shops (name, website_url, logo_url, market_code, affiliate_params, is_active) 
VALUES (
  'Restorio.sk',
  'https://www.restorio.sk',
  'https://www.restorio.sk/favicon.ico',
  'SK',
  '{"utm_source": "dognet", "a_cid": "908fbcd7"}'::jsonb,
  true
);

-- Create book subcategories under "Knihy" category (ID: 7ac4f137-a794-43b7-99b3-966c6ebc807f)
INSERT INTO public.categories (name, slug, parent_id, market_code, description, is_active) VALUES
('Beletria', 'beletria', '7ac4f137-a794-43b7-99b3-966c6ebc807f', 'SK', 'Romány, poviedky, poézia a ďalšia krásna literatúra', true),
('Náboženstvo', 'nabozenstvo', '7ac4f137-a794-43b7-99b3-966c6ebc807f', 'SK', 'Kresťanské knihy, duchovnosť a biblické štúdie', true),
('História', 'historia', '7ac4f137-a794-43b7-99b3-966c6ebc807f', 'SK', 'Historické knihy, biografie a dejiny', true),
('Vzdelávanie', 'vzdelavanie', '7ac4f137-a794-43b7-99b3-966c6ebc807f', 'SK', 'Učebnice, slovníky a jazykové kurzy', true),
('Detské knihy', 'detske-knihy', '7ac4f137-a794-43b7-99b3-966c6ebc807f', 'SK', 'Rozprávky, výučba a detská literatúra', true),
('Odborná literatúra', 'odborna-literatura', '7ac4f137-a794-43b7-99b3-966c6ebc807f', 'SK', 'Ekonomika, právo, medicína a IT knihy', true);

-- Create XML feed entry for Restorio.sk
INSERT INTO public.xml_feeds (name, url, market_code, feed_type, is_active, mapping_config, affiliate_link_template) 
VALUES (
  'Restorio.sk Books Feed',
  'https://yaby.eu/pythonProject/projekt/antik/feedy_tvorba_antik/trhknih/dognetsk.xml',
  'SK',
  'xml',
  true,
  '{
    "product_element": "SHOPITEM",
    "fields": {
      "title": "PRODUCTNAME",
      "description": "DESCRIPTION",
      "price": "PRICE_VAT",
      "original_price": "PRICE",
      "image_url": "IMGURL",
      "external_id": "ITEM_ID",
      "category": "CATEGORYTEXT",
      "availability": "DELIVERY_DATE",
      "author": "AUTHOR",
      "publisher": "MANUFACTURER",
      "isbn": "EAN"
    },
    "category_mapping": {
      "beletria": ["beletria", "roman", "poezia", "drama", "novela"],
      "nabozenstvo": ["krestanske", "nabozenske", "spiritualne", "biblia", "teologia"],
      "historia": ["historia", "dejiny", "biografia", "historicke", "pamati"],
      "vzdelavanie": ["ucebnica", "slovnik", "jazyk", "kurzovnik", "gramatika"],
      "detske-knihy": ["detske", "rozpravka", "mladez", "omalovanky", "basne"],
      "odborna-literatura": ["ekonomia", "pravo", "medicina", "technika", "informatika", "veda"]
    }
  }'::jsonb,
  '{
    "base_url": "https://www.restorio.sk",
    "parameters": {
      "utm_source": "dognet",
      "a_cid": "908fbcd7"
    }
  }'::jsonb
);