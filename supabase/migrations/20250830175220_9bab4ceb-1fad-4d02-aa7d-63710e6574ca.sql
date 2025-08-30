-- Fix malformed affiliate URLs by removing the double domain
UPDATE affiliate_links 
SET affiliate_url = REPLACE(affiliate_url, 'https://restorio.skhttps%3A%2F%2Fwww.restorio.sk%2F', 'https://www.restorio.sk/')
WHERE affiliate_url LIKE '%restorio.skhttps%3A%2F%2Fwww.restorio.sk%2F%';