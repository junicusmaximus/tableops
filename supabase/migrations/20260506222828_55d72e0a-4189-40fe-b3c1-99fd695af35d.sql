
CREATE OR REPLACE FUNCTION public._rls_rbac_test()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $fn$
DECLARE
  org_a uuid := '11111111-aaaa-aaaa-aaaa-111111111111';
  org_b uuid := '22222222-bbbb-bbbb-bbbb-222222222222';
  brand_a uuid := '11111111-aaaa-aaaa-aaaa-1111111111aa';
  brand_b uuid := '22222222-bbbb-bbbb-bbbb-2222222222bb';
  store_a1 uuid := '11111111-aaaa-aaaa-aaaa-1111111111a1';
  store_a2 uuid := '11111111-aaaa-aaaa-aaaa-1111111111a2';
  store_b1 uuid := '22222222-bbbb-bbbb-bbbb-2222222222b1';

  u_ceo   uuid := 'aaaaaaa1-0000-0000-0000-000000000001';
  u_owner uuid := 'aaaaaaa1-0000-0000-0000-000000000002';
  u_boss  uuid := 'aaaaaaa1-0000-0000-0000-000000000003';
  u_mgr   uuid := 'aaaaaaa1-0000-0000-0000-000000000004';
  u_ft    uuid := 'aaaaaaa1-0000-0000-0000-000000000005';
  u_pt    uuid := 'aaaaaaa1-0000-0000-0000-000000000006';
  u_b_mgr uuid := 'bbbbbbb2-0000-0000-0000-000000000001';

  user_ids uuid[];
  uid uuid;
  cnt int;
BEGIN
  user_ids := ARRAY[u_ceo, u_owner, u_boss, u_mgr, u_ft, u_pt, u_b_mgr];

  -- Seed auth.users (minimal)
  FOREACH uid IN ARRAY user_ids LOOP
    INSERT INTO auth.users (id, instance_id, aud, role, email, created_at, updated_at)
    VALUES (uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'rls-test-' || uid::text || '@example.invalid', now(), now())
    ON CONFLICT (id) DO NOTHING;
  END LOOP;

  -- Seed orgs/brands/stores
  INSERT INTO public.organizations (id, name) VALUES
    (org_a, '_rls_test_org_a'), (org_b, '_rls_test_org_b');
  INSERT INTO public.brands (id, organization_id, name) VALUES
    (brand_a, org_a, '_rls_test_brand_a'),
    (brand_b, org_b, '_rls_test_brand_b');
  INSERT INTO public.stores (id, brand_id, organization_id, name) VALUES
    (store_a1, brand_a, org_a, '_rls_test_store_a1'),
    (store_a2, brand_a, org_a, '_rls_test_store_a2'),
    (store_b1, brand_b, org_b, '_rls_test_store_b1');

  INSERT INTO public.user_store_roles (user_id, store_id, role) VALUES
    (u_ceo,  store_a1, 'ceo'),
    (u_owner, store_a1, 'owner'),
    (u_boss, store_a1, 'boss'),
    (u_mgr,  store_a1, 'manager'),
    (u_ft,   store_a1, 'full_time'),
    (u_pt,   store_a1, 'part_time'),
    (u_b_mgr, store_b1, 'manager');

  INSERT INTO public.employee_profiles (user_id, full_name, store_id, brand_id, organization_id, position, invite_status, status) VALUES
    (u_ceo,  '_rls_ceo',  store_a1, brand_a, org_a, 'ceo',       'linked', 'active'),
    (u_owner,'_rls_own',  store_a1, brand_a, org_a, 'owner',     'linked', 'active'),
    (u_boss, '_rls_boss', store_a1, brand_a, org_a, 'boss',      'linked', 'active'),
    (u_mgr,  '_rls_mgr',  store_a1, brand_a, org_a, 'manager',   'linked', 'active'),
    (u_ft,   '_rls_ft',   store_a1, brand_a, org_a, 'full_time', 'linked', 'active'),
    (u_pt,   '_rls_pt',   store_a1, brand_a, org_a, 'part_time', 'linked', 'active'),
    (u_b_mgr,'_rls_bmgr', store_b1, brand_b, org_b, 'manager',   'linked', 'active');

  -- has_role
  IF NOT public.has_role(u_ceo, 'ceo')           THEN RAISE EXCEPTION 'has_role: ceo'; END IF;
  IF     public.has_role(u_mgr, 'ceo')           THEN RAISE EXCEPTION 'has_role: mgr should not be ceo'; END IF;
  IF NOT public.has_role(u_pt, 'part_time')      THEN RAISE EXCEPTION 'has_role: part_time'; END IF;
  IF     public.has_role(u_pt, 'manager')        THEN RAISE EXCEPTION 'has_role: pt should not be manager'; END IF;

  -- has_role_or_higher
  IF NOT public.has_role_or_higher(u_ceo,'manager')   THEN RAISE EXCEPTION 'rank: ceo>=manager'; END IF;
  IF NOT public.has_role_or_higher(u_owner,'manager') THEN RAISE EXCEPTION 'rank: owner>=manager'; END IF;
  IF NOT public.has_role_or_higher(u_boss,'manager')  THEN RAISE EXCEPTION 'rank: boss>=manager'; END IF;
  IF NOT public.has_role_or_higher(u_mgr,'manager')   THEN RAISE EXCEPTION 'rank: mgr>=manager'; END IF;
  IF     public.has_role_or_higher(u_ft,'manager')    THEN RAISE EXCEPTION 'rank: ft<manager'; END IF;
  IF     public.has_role_or_higher(u_pt,'manager')    THEN RAISE EXCEPTION 'rank: pt<manager'; END IF;
  IF     public.has_role_or_higher(u_pt,'full_time')  THEN RAISE EXCEPTION 'rank: pt<full_time'; END IF;

  -- is_store_member
  IF NOT public.is_store_member(u_mgr, store_a1) THEN RAISE EXCEPTION 'sm: mgr in own store'; END IF;
  IF     public.is_store_member(u_mgr, store_a2) THEN RAISE EXCEPTION 'sm: mgr not in other store'; END IF;
  IF     public.is_store_member(u_mgr, store_b1) THEN RAISE EXCEPTION 'sm: mgr not in cross-org store'; END IF;
  IF NOT public.is_store_member(u_ceo, store_b1) THEN RAISE EXCEPTION 'sm: ceo implicit anywhere'; END IF;
  IF NOT public.is_store_member(u_owner, store_b1) THEN RAISE EXCEPTION 'sm: owner implicit anywhere'; END IF;
  IF     public.is_store_member(u_boss, store_b1) THEN RAISE EXCEPTION 'sm: boss not implicit elsewhere'; END IF;
  IF     public.is_store_member(u_pt, store_b1)   THEN RAISE EXCEPTION 'sm: pt not cross-store'; END IF;

  -- is_org_member
  IF NOT public.is_org_member(u_mgr, org_a) THEN RAISE EXCEPTION 'om: mgr own org'; END IF;
  IF     public.is_org_member(u_mgr, org_b) THEN RAISE EXCEPTION 'om: mgr not other org'; END IF;
  IF NOT public.is_org_member(u_ceo, org_b) THEN RAISE EXCEPTION 'om: ceo implicit'; END IF;
  IF NOT public.is_org_member(u_owner, org_b) THEN RAISE EXCEPTION 'om: owner implicit'; END IF;
  IF     public.is_org_member(u_pt, org_b)  THEN RAISE EXCEPTION 'om: pt not cross-org'; END IF;

  -- get_user_store_ids/brand_ids/org_ids
  SELECT count(*) INTO cnt FROM public.get_user_store_ids(u_mgr);
  IF cnt <> 1 THEN RAISE EXCEPTION 'get_user_store_ids count mgr=% expected 1', cnt; END IF;
  SELECT count(*) INTO cnt FROM public.get_user_brand_ids(u_mgr);
  IF cnt <> 1 THEN RAISE EXCEPTION 'get_user_brand_ids count mgr=% expected 1', cnt; END IF;
  SELECT count(*) INTO cnt FROM public.get_user_org_ids(u_mgr);
  IF cnt <> 1 THEN RAISE EXCEPTION 'get_user_org_ids count mgr=% expected 1', cnt; END IF;
  IF EXISTS (SELECT 1 FROM public.get_user_store_ids(u_mgr) s WHERE s = store_b1)
    THEN RAISE EXCEPTION 'mgr store set leaked store_b1'; END IF;

  -- can_view_sales (default: no company_settings row -> manager allowed)
  IF NOT public.can_view_sales(u_ceo, store_b1)   THEN RAISE EXCEPTION 'sales: ceo any store'; END IF;
  IF NOT public.can_view_sales(u_owner, store_b1) THEN RAISE EXCEPTION 'sales: owner any store'; END IF;
  IF NOT public.can_view_sales(u_boss, store_a1)  THEN RAISE EXCEPTION 'sales: boss own store'; END IF;
  IF     public.can_view_sales(u_boss, store_b1)  THEN RAISE EXCEPTION 'sales: boss NOT other'; END IF;
  IF NOT public.can_view_sales(u_mgr, store_a1)   THEN RAISE EXCEPTION 'sales: mgr default-allow'; END IF;
  IF     public.can_view_sales(u_mgr, store_b1)   THEN RAISE EXCEPTION 'sales: mgr NOT other'; END IF;
  IF     public.can_view_sales(u_ft, store_a1)    THEN RAISE EXCEPTION 'sales: ft never'; END IF;
  IF     public.can_view_sales(u_pt, store_a1)    THEN RAISE EXCEPTION 'sales: pt never'; END IF;

  -- Toggle company setting and re-test manager
  INSERT INTO public.company_settings (organization_id, allow_manager_sales_access, updated_by)
    VALUES (org_a, false, u_ceo);
  IF public.can_view_sales(u_mgr, store_a1)       THEN RAISE EXCEPTION 'sales: mgr blocked when toggled off'; END IF;
  IF NOT public.can_view_sales(u_boss, store_a1)  THEN RAISE EXCEPTION 'sales: boss still allowed'; END IF;
  IF NOT public.can_view_sales(u_ceo, store_a1)   THEN RAISE EXCEPTION 'sales: ceo still allowed'; END IF;

  -- can_manage_sales_settings: CEO of that org only
  IF NOT public.can_manage_sales_settings(u_ceo, org_a)   THEN RAISE EXCEPTION 'cms: ceo own org'; END IF;
  IF     public.can_manage_sales_settings(u_owner, org_a) THEN RAISE EXCEPTION 'cms: owner cannot'; END IF;
  IF     public.can_manage_sales_settings(u_mgr, org_a)   THEN RAISE EXCEPTION 'cms: mgr cannot'; END IF;
  -- Note: ceo across orgs - is_org_member is true for ceo anywhere, so this returns true.
  -- That matches the helper's documented behavior (CEO is global admin).
  IF NOT public.can_manage_sales_settings(u_ceo, org_b)   THEN RAISE EXCEPTION 'cms: ceo is global admin'; END IF;

  -- ============ Cleanup (always runs via finally-style block below) ============
  PERFORM public._rls_rbac_test_cleanup();
  RETURN 'ok';

EXCEPTION WHEN OTHERS THEN
  PERFORM public._rls_rbac_test_cleanup();
  RAISE;
END
$fn$;

CREATE OR REPLACE FUNCTION public._rls_rbac_test_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $cleanup$
DECLARE
  org_a uuid := '11111111-aaaa-aaaa-aaaa-111111111111';
  org_b uuid := '22222222-bbbb-bbbb-bbbb-222222222222';
  user_ids uuid[] := ARRAY[
    'aaaaaaa1-0000-0000-0000-000000000001'::uuid,
    'aaaaaaa1-0000-0000-0000-000000000002'::uuid,
    'aaaaaaa1-0000-0000-0000-000000000003'::uuid,
    'aaaaaaa1-0000-0000-0000-000000000004'::uuid,
    'aaaaaaa1-0000-0000-0000-000000000005'::uuid,
    'aaaaaaa1-0000-0000-0000-000000000006'::uuid,
    'bbbbbbb2-0000-0000-0000-000000000001'::uuid
  ];
BEGIN
  DELETE FROM public.company_settings WHERE organization_id IN (org_a, org_b);
  DELETE FROM public.employee_profiles WHERE user_id = ANY(user_ids);
  DELETE FROM public.user_store_roles WHERE user_id = ANY(user_ids);
  DELETE FROM public.stores WHERE organization_id IN (org_a, org_b);
  DELETE FROM public.brands WHERE organization_id IN (org_a, org_b);
  DELETE FROM public.organizations WHERE id IN (org_a, org_b);
  DELETE FROM auth.users WHERE id = ANY(user_ids);
END
$cleanup$;

REVOKE ALL ON FUNCTION public._rls_rbac_test() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._rls_rbac_test_cleanup() FROM PUBLIC, anon, authenticated;
