-- Clear all existing data in the correct order (respecting foreign key constraints)
DELETE FROM affiliate_links;
DELETE FROM products;
DELETE FROM import_logs;
DELETE FROM xml_feeds;

-- Update the handle_new_user function to assign admin role only to specific email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, role)
  VALUES (
    NEW.id, 
    NEW.email,
    CASE 
      WHEN NEW.email = 'atm.trading.general@gmail.com' THEN 'admin'::public.app_role
      ELSE 'user'::public.app_role
    END
  );
  RETURN NEW;
END;
$function$;