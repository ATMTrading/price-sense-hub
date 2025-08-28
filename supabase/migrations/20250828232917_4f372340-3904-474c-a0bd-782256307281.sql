-- Enable password protection settings to resolve security warning
UPDATE auth.config
SET password_min_length = 8,
    password_requirements = 'strong';

-- Enable leaked password protection
INSERT INTO auth.config (key, value) 
VALUES ('password_check_leaked', 'true')
ON CONFLICT (key) 
DO UPDATE SET value = 'true';