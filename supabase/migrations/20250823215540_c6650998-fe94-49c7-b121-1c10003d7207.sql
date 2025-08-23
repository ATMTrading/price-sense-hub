-- Restore the missing products that were imported from 4home.hu
-- Simple insert without ON CONFLICT

-- Get the correct shop and category IDs and insert missing products
DO $$
DECLARE
    shop_id_4home UUID;
    category_home_garden UUID;
    product_id UUID;
BEGIN
    -- Get 4Home shop ID
    SELECT id INTO shop_id_4home FROM shops WHERE name = '4Home' AND market_code = 'HU';
    
    -- Get home-garden category ID
    SELECT id INTO category_home_garden FROM categories WHERE slug = 'home-garden' AND market_code = 'HU';
    
    -- Insert Bellatex product
    IF NOT EXISTS (SELECT 1 FROM products WHERE title ILIKE '%bellatex%frotte%lepedo%' AND market_code = 'HU') THEN
        INSERT INTO products (
            title, image_url, price, currency, market_code, shop_id, category_id, 
            availability, is_active, external_id, description
        ) VALUES (
            'Bellatex frotté lepedő világos zöld, 160 x 200 cm, világoszöld, 160 x 200 cm',
            'https://www.4home.hu/image/catalog/products/product-images/BellaLepedoVilagoszold160x200/BellaLepedoVilagoszold160x200-1.jpg',
            2690, 'HUF', 'HU', shop_id_4home, category_home_garden, 'in_stock', true,
            'bellatex-frotte-lepedo-vilagos-zold', 'Bellatex frotté lepedő világos zöld színben'
        ) RETURNING id INTO product_id;
        
        -- Insert affiliate link for this product
        INSERT INTO affiliate_links (product_id, affiliate_url, tracking_code, commission_rate, is_active)
        VALUES (product_id, 'https://go.dognet.com/?chid=IzDRhdYj&url=https://www.4home.hu/bellatex-frotte-lepedo-vilagos-zold-160-x-200-cm', 'dognet-4home', 5.0, true);
    END IF;
    
    -- Insert Gardinia product
    IF NOT EXISTS (SELECT 1 FROM products WHERE title ILIKE '%mini%relax%redony%' AND market_code = 'HU') THEN
        INSERT INTO products (
            title, image_url, price, currency, market_code, shop_id, category_id, 
            availability, is_active, external_id, description
        ) VALUES (
            'Mini Relax redőny sötét szürke , 57 x 150 cm, sötétszürke, 57 x 150 cm',
            'https://www.4home.hu/image/catalog/products/product-images/GardiniaMiniRelaxRedony57x150/GardiniaMiniRelaxRedony57x150-1.jpg',
            1990, 'HUF', 'HU', shop_id_4home, category_home_garden, 'in_stock', true,
            'gardinia-mini-relax-redony-sotet-szurke', 'Gardinia Mini Relax redőny sötét szürke színben'
        ) RETURNING id INTO product_id;
        
        INSERT INTO affiliate_links (product_id, affiliate_url, tracking_code, commission_rate, is_active)
        VALUES (product_id, 'https://go.dognet.com/?chid=IzDRhdYj&url=https://www.4home.hu/gardinia-mini-relax-redony-sotet-szurke-57-x-150-cm', 'dognet-4home', 5.0, true);
    END IF;
    
    -- Insert Curver product
    IF NOT EXISTS (SELECT 1 FROM products WHERE title ILIKE '%curver%jute%kosar%' AND market_code = 'HU') THEN
        INSERT INTO products (
            title, image_url, price, currency, market_code, shop_id, category_id, 
            availability, is_active, external_id, description
        ) VALUES (
            'Curver Jute L 20 l kosár, taupe',
            'https://www.4home.hu/image/catalog/products/product-images/CurverJuteL20lKosarTaupe/CurverJuteL20lKosarTaupe-1.jpg',
            3290, 'HUF', 'HU', shop_id_4home, category_home_garden, 'in_stock', true,
            'curver-jute-l-20-l-kosar-taupe', 'Curver Jute kosár 20 liter, taupe színben'
        ) RETURNING id INTO product_id;
        
        INSERT INTO affiliate_links (product_id, affiliate_url, tracking_code, commission_rate, is_active)
        VALUES (product_id, 'https://go.dognet.com/?chid=IzDRhdYj&url=https://www.4home.hu/curver-jute-l-20-l-kosar-taupe', 'dognet-4home', 5.0, true);
    END IF;
    
    -- Insert De Buyer product
    IF NOT EXISTS (SELECT 1 FROM products WHERE title ILIKE '%de buyer%szilikon%forma%' AND market_code = 'HU') THEN
        INSERT INTO products (
            title, image_url, price, currency, market_code, shop_id, category_id, 
            availability, is_active, external_id, description
        ) VALUES (
            'De Buyer 1964.01 szilikon forma Moul''flex Briošky,6 db',
            'https://www.4home.hu/image/catalog/products/product-images/DeBuyerSzilikonFormaMoulflexBriosky6db/DeBuyerSzilikonFormaMoulflexBriosky6db-1.jpg',
            4490, 'HUF', 'HU', shop_id_4home, category_home_garden, 'in_stock', true,
            'de-buyer-szilikon-forma-moul-flex-briosky', 'De Buyer szilikon forma Briošky készítéshez'
        ) RETURNING id INTO product_id;
        
        INSERT INTO affiliate_links (product_id, affiliate_url, tracking_code, commission_rate, is_active)
        VALUES (product_id, 'https://go.dognet.com/?chid=IzDRhdYj&url=https://www.4home.hu/de-buyer-szilikon-forma-moul-flex-briosky-6-db', 'dognet-4home', 5.0, true);
    END IF;
    
END $$;