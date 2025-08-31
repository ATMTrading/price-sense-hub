-- Update all lowercase market codes to uppercase across all tables
UPDATE products SET market_code = UPPER(market_code) WHERE market_code != UPPER(market_code);
UPDATE categories SET market_code = UPPER(market_code) WHERE market_code != UPPER(market_code);  
UPDATE shops SET market_code = UPPER(market_code) WHERE market_code != UPPER(market_code);
UPDATE affiliate_networks SET market_code = UPPER(market_code) WHERE market_code != UPPER(market_code);
UPDATE xml_feeds SET market_code = UPPER(market_code) WHERE market_code != UPPER(market_code);