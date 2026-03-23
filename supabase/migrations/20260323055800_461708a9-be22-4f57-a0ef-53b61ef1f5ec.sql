
-- Connect test user to seeded Gangnam store
INSERT INTO public.employee_profiles (user_id, full_name, phone, store_id, brand_id, organization_id, position, employment_type, invite_status, linked_at, status)
VALUES (
  '2c85e748-71cc-4bed-9a38-d0c7b2ce8769',
  '테스트사장',
  '010-1234-5678',
  'c0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'ceo',
  'full_time',
  'linked',
  now(),
  'active'
);

INSERT INTO public.user_store_roles (user_id, store_id, role)
VALUES (
  '2c85e748-71cc-4bed-9a38-d0c7b2ce8769',
  'c0000000-0000-0000-0000-000000000001',
  'ceo'::app_role
);
