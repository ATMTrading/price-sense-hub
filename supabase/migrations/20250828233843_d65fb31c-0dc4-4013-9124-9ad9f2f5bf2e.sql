-- Create book categories for SK market
INSERT INTO categories (name, slug, market_code, description, is_active) VALUES
('Knihy', 'books', 'SK', 'Všetky druhy kníh', true),
('Beletria', 'fiction', 'SK', 'Krásna literatúra a beletria', true),
('Náučná literatúra', 'non-fiction', 'SK', 'Náučné a odborné knihy', true),
('Detské knihy', 'children-books', 'SK', 'Knihy pre deti', true)
ON CONFLICT (slug, market_code) DO NOTHING;