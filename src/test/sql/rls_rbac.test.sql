-- ============================================================================
-- RLS / RBAC database-level test suite
--
-- Verifies the SECURITY DEFINER helper functions used by every RLS policy:
--   has_role, has_role_or_higher, is_store_member, is_org_member,
--   can_view_sales, can_manage_sales_settings,
--   get_user_store_ids, get_user_brand_ids, get_user_org_ids
--
-- Run inside a transaction and ROLLBACK at the end so it is non-destructive.
--
-- Usage:
--   psql -f src/test/sql/rls_rbac.test.sql
--
-- A failed ASSERT raises an exception and rolls back the whole transaction.
-- ============================================================================

\set ON_ERROR_STOP on
BEGIN;

-- Sandboxed test data lives in temp tables; we reference real schema only
-- through inserts into public tables which are rolled back.

-- ---- Seed two organizations / brands / stores ----
DO $$
DECLARE
  org_a uuid := '11111111-1111-1111-1111-111111111111';
  org_b uuid := '22222222-2222-2222-2222-222222222222';
  brand_a uuid := '11111111-1111-1111-1111-1111111111aa';
  brand_b uuid := '22222222-2222-2222-2222-2222222222bb';
  store_a1 uuid := '11111111-1111-1111-1111-1111111111a1';
  store_a2 uuid := '11111111-1111-1111-1111-1111111111a2';
  store_b1 uuid := '22222222-2222-2222-2222-2222222222b1';

  -- Users
  u_ceo  uuid := 'aaaaaaaa-0000-0000-0000-0000000000c0';  -- CEO of org A
  u_owner uuid := 'aaaaaaaa-0000-0000-0000-00000000000d'; -- Owner role (cross-brand admin)
  u_boss uuid := 'aaaaaaaa-0000-0000-0000-0000000000b0';  -- Boss of store_a1
  u_mgr  uuid := 'aaaaaaaa-0000-0000-0000-00000000a001';  -- Manager of store_a1
  u_ft   uuid := 'aaaaaaaa-0000-0000-0000-0000000ff001';  -- Full-time at store_a1
  u_pt   uuid := 'aaaaaaaa-0000-0000-0000-00000000a002';  -- Part-timer at store_a1
  u_b_mgr uuid := 'bbbbbbbb-0000-0000-0000-00000000b001'; -- Manager of store_b1 (other org)

  v boolean;
  cnt int;
BEGIN
  -- Org / brand / store
  INSERT INTO public.organizations (id, name) VALUES
    (org_a, 'Org A'), (org_b, 'Org B');
  INSERT INTO public.brands (id, organization_id, name) VALUES
    (brand_a, org_a, 'Brand A'),
    (brand_b, org_b, 'Brand B');
  INSERT INTO public.stores (id, brand_id, organization_id, name) VALUES
    (store_a1, brand_a, org_a, 'Store A1'),
    (store_a2, brand_a, org_a, 'Store A2'),
    (store_b1, brand_b, org_b, 'Store B1');

  -- user_store_roles
  INSERT INTO public.user_store_roles (user_id, store_id, role) VALUES
    (u_ceo,  store_a1, 'ceo'),
    (u_owner, store_a1, 'owner'),
    (u_boss, store_a1, 'boss'),
    (u_mgr,  store_a1, 'manager'),
    (u_ft,   store_a1, 'full_time'),
    (u_pt,   store_a1, 'part_time'),
    (u_b_mgr, store_b1, 'manager');

  -- employee_profiles (drives get_user_org_ids / brand_ids)
  INSERT INTO public.employee_profiles (user_id, full_name, store_id, brand_id, organization_id, position, invite_status, status) VALUES
    (u_ceo,  'CEO A',   store_a1, brand_a, org_a, 'ceo',       'linked', 'active'),
    (u_owner,'Owner A', store_a1, brand_a, org_a, 'owner',     'linked', 'active'),
    (u_boss, 'Boss A',  store_a1, brand_a, org_a, 'boss',      'linked', 'active'),
    (u_mgr,  'Mgr A',   store_a1, brand_a, org_a, 'manager',   'linked', 'active'),
    (u_ft,   'FT A',    store_a1, brand_a, org_a, 'full_time', 'linked', 'active'),
    (u_pt,   'PT A',    store_a1, brand_a, org_a, 'part_time', 'linked', 'active'),
    (u_b_mgr,'Mgr B',   store_b1, brand_b, org_b, 'manager',   'linked', 'active');

  -- =========================================================================
  -- has_role
  -- =========================================================================
  ASSERT public.has_role(u_ceo, 'ceo'),         'has_role: CEO should be ceo';
  ASSERT NOT public.has_role(u_mgr, 'ceo'),     'has_role: manager is NOT ceo';
  ASSERT public.has_role(u_pt, 'part_time'),    'has_role: part_time user';
  ASSERT NOT public.has_role(u_pt, 'manager'),  'has_role: part_time is NOT manager';

  -- =========================================================================
  -- has_role_or_higher (lower numeric rank = higher privilege)
  -- ceo=1 owner=2 boss=3 manager=4 full_time=5 part_time=6
  -- =========================================================================
  ASSERT public.has_role_or_higher(u_ceo, 'manager'),   'rank: ceo >= manager';
  ASSERT public.has_role_or_higher(u_owner, 'manager'), 'rank: owner >= manager';
  ASSERT public.has_role_or_higher(u_boss, 'manager'),  'rank: boss >= manager';
  ASSERT public.has_role_or_higher(u_mgr, 'manager'),   'rank: manager >= manager';
  ASSERT NOT public.has_role_or_higher(u_ft, 'manager'),'rank: full_time < manager';
  ASSERT NOT public.has_role_or_higher(u_pt, 'manager'),'rank: part_time < manager';
  ASSERT NOT public.has_role_or_higher(u_pt, 'full_time'),'rank: part_time < full_time';

  -- =========================================================================
  -- is_store_member
  --   Direct membership OR ceo/owner anywhere
  -- =========================================================================
  ASSERT public.is_store_member(u_mgr, store_a1),     'mgr is member of own store';
  ASSERT NOT public.is_store_member(u_mgr, store_a2), 'mgr is NOT member of other store';
  ASSERT NOT public.is_store_member(u_mgr, store_b1), 'mgr is NOT member of other org store';
  ASSERT public.is_store_member(u_ceo, store_b1),     'ceo is implicit member of any store';
  ASSERT public.is_store_member(u_owner, store_b1),   'owner is implicit member of any store';
  ASSERT NOT public.is_store_member(u_boss, store_b1),'boss is NOT implicit member elsewhere';
  ASSERT NOT public.is_store_member(u_pt, store_b1),  'part_timer is NOT cross-store member';

  -- =========================================================================
  -- is_org_member
  -- =========================================================================
  ASSERT public.is_org_member(u_mgr, org_a),     'mgr is member of own org';
  ASSERT NOT public.is_org_member(u_mgr, org_b), 'mgr is NOT member of other org';
  ASSERT public.is_org_member(u_ceo, org_b),     'ceo is implicit org member anywhere';
  ASSERT public.is_org_member(u_owner, org_b),   'owner is implicit org member anywhere';
  ASSERT NOT public.is_org_member(u_pt, org_b),  'part_time NOT cross-org member';

  -- =========================================================================
  -- get_user_store_ids / brand_ids / org_ids
  -- =========================================================================
  SELECT count(*) INTO cnt FROM public.get_user_store_ids(u_mgr);
  ASSERT cnt = 1, 'mgr has 1 store role';
  SELECT count(*) INTO cnt FROM public.get_user_brand_ids(u_mgr);
  ASSERT cnt = 1, 'mgr has 1 brand via employee_profile';
  SELECT count(*) INTO cnt FROM public.get_user_org_ids(u_mgr);
  ASSERT cnt = 1, 'mgr has 1 org via employee_profile';

  -- Cross-org user must NOT show up in another user's store id set
  PERFORM 1 FROM public.get_user_store_ids(u_mgr) WHERE get_user_store_ids = store_b1;
  ASSERT NOT FOUND, 'mgr store set excludes other-org store';

  -- =========================================================================
  -- can_view_sales
  --   - ceo / owner: always
  --   - boss: only if store member
  --   - manager: only if store member AND company allows (default true)
  --   - staff: never
  -- =========================================================================
  ASSERT public.can_view_sales(u_ceo, store_b1),   'ceo can view any store sales';
  ASSERT public.can_view_sales(u_owner, store_b1), 'owner can view any store sales';
  ASSERT public.can_view_sales(u_boss, store_a1),  'boss can view own store sales';
  ASSERT NOT public.can_view_sales(u_boss, store_b1),'boss CANNOT view other store sales';
  ASSERT public.can_view_sales(u_mgr, store_a1),   'mgr default-allow own store sales';
  ASSERT NOT public.can_view_sales(u_mgr, store_b1),'mgr cannot view other store sales';
  ASSERT NOT public.can_view_sales(u_ft, store_a1),'full_time NEVER sees sales';
  ASSERT NOT public.can_view_sales(u_pt, store_a1),'part_time NEVER sees sales';

  -- Toggle manager off for org A and re-test
  INSERT INTO public.company_settings (organization_id, allow_manager_sales_access, updated_by)
    VALUES (org_a, false, u_ceo);
  ASSERT NOT public.can_view_sales(u_mgr, store_a1),
    'mgr blocked from sales when company setting disables it';
  ASSERT public.can_view_sales(u_boss, store_a1),
    'boss still allowed when manager-toggle is off';
  ASSERT public.can_view_sales(u_ceo, store_a1),
    'ceo still allowed when manager-toggle is off';

  -- =========================================================================
  -- can_manage_sales_settings: only CEO of that org
  -- =========================================================================
  ASSERT public.can_manage_sales_settings(u_ceo, org_a),
    'ceo can manage own org sales settings';
  ASSERT NOT public.can_manage_sales_settings(u_owner, org_a),
    'owner CANNOT manage sales settings (CEO-only)';
  ASSERT NOT public.can_manage_sales_settings(u_mgr, org_a),
    'manager CANNOT manage sales settings';
  ASSERT NOT public.can_manage_sales_settings(u_ceo, org_b),
    'ceo of org A cannot manage org B settings (not org member by employee_profile)';

  RAISE NOTICE 'ALL RLS/RBAC ASSERTIONS PASSED';
END $$;

ROLLBACK;
