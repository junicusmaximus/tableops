
-- Backfill existing users who lack employee_profiles
-- We'll use a DO block to iterate over users missing profiles
DO $$
DECLARE
  _user RECORD;
  _role text;
  _full_name text;
  _phone text;
  _org_id uuid;
  _brand_id uuid;
  _store_id uuid;
  _app_role app_role;
BEGIN
  FOR _user IN 
    SELECT au.id, au.raw_user_meta_data 
    FROM auth.users au 
    LEFT JOIN public.employee_profiles ep ON ep.user_id = au.id
    WHERE ep.id IS NULL
  LOOP
    _role := COALESCE(_user.raw_user_meta_data->>'role', 'part_time');
    _full_name := COALESCE(_user.raw_user_meta_data->>'full_name', '사용자');
    _phone := COALESCE(_user.raw_user_meta_data->>'phone', '');
    
    BEGIN
      _app_role := _role::app_role;
    EXCEPTION WHEN OTHERS THEN
      _app_role := 'part_time'::app_role;
    END;

    IF _role IN ('ceo', 'owner', 'boss', 'manager') THEN
      INSERT INTO public.organizations (name) VALUES (_full_name || '의 조직') RETURNING id INTO _org_id;
      INSERT INTO public.brands (name, organization_id) VALUES (_full_name || '의 브랜드', _org_id) RETURNING id INTO _brand_id;
      INSERT INTO public.stores (name, brand_id, organization_id) VALUES (_full_name || '의 매장', _brand_id, _org_id) RETURNING id INTO _store_id;
    ELSE
      INSERT INTO public.organizations (name) VALUES ('기본 조직') RETURNING id INTO _org_id;
      INSERT INTO public.brands (name, organization_id) VALUES ('기본 브랜드', _org_id) RETURNING id INTO _brand_id;
      INSERT INTO public.stores (name, brand_id, organization_id) VALUES ('기본 매장', _brand_id, _org_id) RETURNING id INTO _store_id;
    END IF;

    INSERT INTO public.employee_profiles (user_id, full_name, phone, store_id, brand_id, organization_id, position, employment_type)
    VALUES (_user.id, _full_name, _phone, _store_id, _brand_id, _org_id, _role,
      CASE WHEN _role IN ('full_time', 'ceo', 'owner', 'boss', 'manager') THEN 'full_time' ELSE 'part_time' END
    );

    -- Only insert role if not already exists
    INSERT INTO public.user_store_roles (user_id, store_id, role)
    VALUES (_user.id, _store_id, _app_role)
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;
