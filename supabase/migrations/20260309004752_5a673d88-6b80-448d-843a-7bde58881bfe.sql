
-- 1. Make user_id nullable in employee_profiles
ALTER TABLE public.employee_profiles ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add invite-related columns
ALTER TABLE public.employee_profiles 
  ADD COLUMN IF NOT EXISTS invite_status text NOT NULL DEFAULT 'linked',
  ADD COLUMN IF NOT EXISTS invited_by uuid,
  ADD COLUMN IF NOT EXISTS invited_at timestamptz,
  ADD COLUMN IF NOT EXISTS linked_at timestamptz;

-- 3. Set existing records as 'linked' (they already have user_id)
UPDATE public.employee_profiles SET invite_status = 'linked', linked_at = created_at WHERE user_id IS NOT NULL AND invite_status = 'linked';

-- 4. Create a function to link pending employee on signup
CREATE OR REPLACE FUNCTION public.link_pending_employee(_user_id uuid, _phone text, _full_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _ep record;
  _result jsonb;
BEGIN
  -- Try to find a pending employee by phone match
  SELECT * INTO _ep FROM public.employee_profiles
    WHERE invite_status = 'pending'
      AND phone IS NOT NULL
      AND phone = _phone
      AND user_id IS NULL
    ORDER BY created_at ASC
    LIMIT 1;

  -- Fallback: name + phone match
  IF _ep IS NULL THEN
    SELECT * INTO _ep FROM public.employee_profiles
      WHERE invite_status = 'pending'
        AND phone IS NOT NULL
        AND phone = _phone
        AND full_name = _full_name
        AND user_id IS NULL
      ORDER BY created_at ASC
      LIMIT 1;
  END IF;

  IF _ep IS NULL THEN
    RETURN jsonb_build_object('linked', false, 'reason', 'no_match');
  END IF;

  -- Check if this phone is already linked to another active user
  IF EXISTS (
    SELECT 1 FROM public.employee_profiles
    WHERE phone = _phone AND user_id IS NOT NULL AND id != _ep.id
  ) THEN
    RETURN jsonb_build_object('linked', false, 'reason', 'already_linked');
  END IF;

  -- Link the employee
  UPDATE public.employee_profiles
    SET user_id = _user_id,
        invite_status = 'linked',
        status = 'active',
        linked_at = now(),
        updated_at = now()
    WHERE id = _ep.id;

  -- Create user_store_role from the pending employee's position/role info
  -- Use the role stored in position column as app_role
  INSERT INTO public.user_store_roles (user_id, store_id, role)
    VALUES (_user_id, _ep.store_id, COALESCE(_ep.position::app_role, 'hall_staff'::app_role))
    ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object(
    'linked', true,
    'employee_profile_id', _ep.id,
    'store_id', _ep.store_id,
    'role', _ep.position
  );
END;
$$;

-- 5. Update handle_new_user to attempt linking pending employees first
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _role text;
  _full_name text;
  _phone text;
  _org_id uuid;
  _brand_id uuid;
  _store_id uuid;
  _app_role app_role;
  _link_result jsonb;
BEGIN
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'part_time');
  _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  _phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');

  -- Try to link to a pending employee record first
  IF _phone IS NOT NULL AND _phone != '' THEN
    _link_result := public.link_pending_employee(NEW.id, _phone, _full_name);
    IF (_link_result->>'linked')::boolean = true THEN
      -- Successfully linked, no need to create new org/brand/store
      RETURN NEW;
    END IF;
  END IF;

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
  INSERT INTO public.employee_profiles (user_id, full_name, phone, store_id, brand_id, organization_id, position, employment_type, invite_status, linked_at, status)
  VALUES (NEW.id, _full_name, _phone, _store_id, _brand_id, _org_id, _role,
    CASE WHEN _role IN ('full_time', 'ceo', 'owner', 'boss', 'manager') THEN 'full_time' ELSE 'part_time' END,
    'linked', now(), 'active'
  );

  -- Create user store role
  INSERT INTO public.user_store_roles (user_id, store_id, role)
  VALUES (NEW.id, _store_id, _app_role);

  RETURN NEW;
END;
$$;

-- 6. Update RLS: allow managers to insert employee_profiles with null user_id (already ep_insert allows manager+)
-- But we need to ensure the ep_insert policy doesn't require user_id match
-- Current ep_insert: has_role_or_higher(auth.uid(), 'manager') - this is fine, no user_id check needed
