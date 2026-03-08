
-- Replace the existing handle_new_user function to auto-create org/brand/store/profile/role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _role text;
  _full_name text;
  _phone text;
  _org_id uuid;
  _brand_id uuid;
  _store_id uuid;
  _app_role app_role;
BEGIN
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'part_time');
  _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  _phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');

  -- Map string role to app_role enum
  _app_role := _role::app_role;

  -- Auto-create organization, brand, store for manager+ roles
  IF _role IN ('ceo', 'owner', 'boss', 'manager') THEN
    INSERT INTO public.organizations (name) VALUES (_full_name || '의 조직') RETURNING id INTO _org_id;
    INSERT INTO public.brands (name, organization_id) VALUES (_full_name || '의 브랜드', _org_id) RETURNING id INTO _brand_id;
    INSERT INTO public.stores (name, brand_id, organization_id) VALUES (_full_name || '의 매장', _brand_id, _org_id) RETURNING id INTO _store_id;
  ELSE
    -- For staff roles, create a placeholder org/brand/store (they'd normally be invited)
    INSERT INTO public.organizations (name) VALUES ('기본 조직') RETURNING id INTO _org_id;
    INSERT INTO public.brands (name, organization_id) VALUES ('기본 브랜드', _org_id) RETURNING id INTO _brand_id;
    INSERT INTO public.stores (name, brand_id, organization_id) VALUES ('기본 매장', _brand_id, _org_id) RETURNING id INTO _store_id;
  END IF;

  -- Create employee profile
  INSERT INTO public.employee_profiles (user_id, full_name, phone, store_id, brand_id, organization_id, position, employment_type)
  VALUES (NEW.id, _full_name, _phone, _store_id, _brand_id, _org_id, _role, 
    CASE WHEN _role IN ('full_time', 'ceo', 'owner', 'boss', 'manager') THEN 'full_time' ELSE 'part_time' END
  );

  -- Create user store role
  INSERT INTO public.user_store_roles (user_id, store_id, role)
  VALUES (NEW.id, _store_id, _app_role);

  RETURN NEW;
END;
$function$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
