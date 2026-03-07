
-- =====================================================
-- 1. DROP ALL RLS POLICIES that reference old role enum
-- =====================================================
DROP POLICY IF EXISTS "att_select" ON public.attendance_logs;
DROP POLICY IF EXISTS "att_insert" ON public.attendance_logs;
DROP POLICY IF EXISTS "att_update" ON public.attendance_logs;
DROP POLICY IF EXISTS "ep_select" ON public.employee_profiles;
DROP POLICY IF EXISTS "ep_insert" ON public.employee_profiles;
DROP POLICY IF EXISTS "ep_update" ON public.employee_profiles;
DROP POLICY IF EXISTS "brand_select" ON public.brands;
DROP POLICY IF EXISTS "brand_manage" ON public.brands;
DROP POLICY IF EXISTS "org_select" ON public.organizations;
DROP POLICY IF EXISTS "org_insert" ON public.organizations;
DROP POLICY IF EXISTS "org_update" ON public.organizations;
DROP POLICY IF EXISTS "org_delete" ON public.organizations;
DROP POLICY IF EXISTS "store_select" ON public.stores;
DROP POLICY IF EXISTS "store_manage" ON public.stores;
DROP POLICY IF EXISTS "sr_select" ON public.sales_records;
DROP POLICY IF EXISTS "sr_insert" ON public.sales_records;
DROP POLICY IF EXISTS "sr_update" ON public.sales_records;
DROP POLICY IF EXISTS "sr_delete" ON public.sales_records;
DROP POLICY IF EXISTS "st_select" ON public.sales_targets;
DROP POLICY IF EXISTS "st_insert" ON public.sales_targets;
DROP POLICY IF EXISTS "st_update" ON public.sales_targets;
DROP POLICY IF EXISTS "usr_select" ON public.user_store_roles;
DROP POLICY IF EXISTS "usr_manage" ON public.user_store_roles;
DROP POLICY IF EXISTS "brk_select" ON public.break_logs;
DROP POLICY IF EXISTS "brk_insert" ON public.break_logs;
DROP POLICY IF EXISTS "brk_update" ON public.break_logs;
DROP POLICY IF EXISTS "room_select" ON public.chat_rooms;
DROP POLICY IF EXISTS "room_insert" ON public.chat_rooms;
DROP POLICY IF EXISTS "member_select" ON public.chat_room_members;
DROP POLICY IF EXISTS "member_insert" ON public.chat_room_members;
DROP POLICY IF EXISTS "msg_select" ON public.chat_messages;
DROP POLICY IF EXISTS "msg_insert" ON public.chat_messages;
DROP POLICY IF EXISTS "receipt_select" ON public.chat_read_receipts;
DROP POLICY IF EXISTS "receipt_update" ON public.chat_read_receipts;
DROP POLICY IF EXISTS "receipt_upsert" ON public.chat_read_receipts;

-- =====================================================
-- 2. DROP FUNCTIONS that depend on old enum
-- =====================================================
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.has_role_or_higher(uuid, public.app_role);

-- =====================================================
-- 3. MIGRATE ROLE ENUM: 5-tier → 4-tier
-- =====================================================
CREATE TYPE public.app_role_new AS ENUM ('owner', 'manager', 'kitchen_staff', 'hall_staff');

ALTER TABLE public.user_store_roles ADD COLUMN role_new public.app_role_new;
UPDATE public.user_store_roles SET role_new = CASE
  WHEN role::text = 'super_admin' THEN 'owner'::public.app_role_new
  WHEN role::text = 'brand_admin' THEN 'owner'::public.app_role_new
  WHEN role::text = 'store_manager' THEN 'manager'::public.app_role_new
  WHEN role::text = 'shift_leader' THEN 'manager'::public.app_role_new
  WHEN role::text = 'staff' THEN 'hall_staff'::public.app_role_new
  ELSE 'hall_staff'::public.app_role_new
END;

ALTER TABLE public.user_store_roles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.user_store_roles ALTER COLUMN role DROP NOT NULL;
ALTER TABLE public.user_store_roles DROP COLUMN role;
ALTER TABLE public.user_store_roles RENAME COLUMN role_new TO role;
ALTER TABLE public.user_store_roles ALTER COLUMN role SET NOT NULL;
ALTER TABLE public.user_store_roles ALTER COLUMN role SET DEFAULT 'hall_staff'::public.app_role_new;

DROP TYPE public.app_role;
ALTER TYPE public.app_role_new RENAME TO app_role;

-- =====================================================
-- 4. RECREATE SECURITY DEFINER FUNCTIONS
-- =====================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_store_roles WHERE user_id = _user_id AND role = _role); $$;

CREATE OR REPLACE FUNCTION public.has_role_or_higher(_user_id uuid, _min_role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_store_roles WHERE user_id = _user_id AND role <= _min_role); $$;

-- =====================================================
-- 5. RECREATE ALL RLS POLICIES (PERMISSIVE)
-- =====================================================
-- attendance_logs
CREATE POLICY "att_select" ON public.attendance_logs FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_store_member(auth.uid(), store_id));
CREATE POLICY "att_insert" ON public.attendance_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "att_update" ON public.attendance_logs FOR UPDATE TO authenticated USING (user_id = auth.uid() OR has_role_or_higher(auth.uid(), 'manager'::app_role));

-- employee_profiles
CREATE POLICY "ep_select" ON public.employee_profiles FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_store_member(auth.uid(), store_id));
CREATE POLICY "ep_insert" ON public.employee_profiles FOR INSERT TO authenticated WITH CHECK (has_role_or_higher(auth.uid(), 'manager'::app_role));
CREATE POLICY "ep_update" ON public.employee_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid() OR has_role_or_higher(auth.uid(), 'manager'::app_role));

-- brands
CREATE POLICY "brand_select" ON public.brands FOR SELECT TO authenticated USING (id IN (SELECT get_user_brand_ids(auth.uid())) OR has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "brand_manage" ON public.brands FOR ALL TO authenticated USING (has_role(auth.uid(), 'owner'::app_role));

-- organizations
CREATE POLICY "org_select" ON public.organizations FOR SELECT TO authenticated USING (id IN (SELECT get_user_org_ids(auth.uid())) OR has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "org_manage" ON public.organizations FOR ALL TO authenticated USING (has_role(auth.uid(), 'owner'::app_role));

-- stores
CREATE POLICY "store_select" ON public.stores FOR SELECT TO authenticated USING (id IN (SELECT get_user_store_ids(auth.uid())) OR has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "store_manage" ON public.stores FOR ALL TO authenticated USING (has_role(auth.uid(), 'owner'::app_role));

-- sales_records
CREATE POLICY "sr_select" ON public.sales_records FOR SELECT TO authenticated USING (is_store_member(auth.uid(), store_id));
CREATE POLICY "sr_insert" ON public.sales_records FOR INSERT TO authenticated WITH CHECK (is_store_member(auth.uid(), store_id) AND recorded_by = auth.uid());
CREATE POLICY "sr_update" ON public.sales_records FOR UPDATE TO authenticated USING (is_store_member(auth.uid(), store_id));
CREATE POLICY "sr_delete" ON public.sales_records FOR DELETE TO authenticated USING (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role));

-- sales_targets
CREATE POLICY "st_select" ON public.sales_targets FOR SELECT TO authenticated USING (is_store_member(auth.uid(), store_id));
CREATE POLICY "st_insert" ON public.sales_targets FOR INSERT TO authenticated WITH CHECK (is_store_member(auth.uid(), store_id) AND created_by = auth.uid() AND has_role_or_higher(auth.uid(), 'manager'::app_role));
CREATE POLICY "st_update" ON public.sales_targets FOR UPDATE TO authenticated USING (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role));

-- user_store_roles
CREATE POLICY "usr_select" ON public.user_store_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_store_member(auth.uid(), store_id));
CREATE POLICY "usr_manage" ON public.user_store_roles FOR ALL TO authenticated USING (has_role_or_higher(auth.uid(), 'manager'::app_role));

-- break_logs
CREATE POLICY "brk_select" ON public.break_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM attendance_logs al WHERE al.id = break_logs.attendance_log_id AND (al.user_id = auth.uid() OR is_store_member(auth.uid(), al.store_id))));
CREATE POLICY "brk_insert" ON public.break_logs FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM attendance_logs al WHERE al.id = break_logs.attendance_log_id AND al.user_id = auth.uid()));
CREATE POLICY "brk_update" ON public.break_logs FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM attendance_logs al WHERE al.id = break_logs.attendance_log_id AND al.user_id = auth.uid()));

-- chat_rooms
CREATE POLICY "room_select" ON public.chat_rooms FOR SELECT TO authenticated USING (is_store_member(auth.uid(), store_id));
CREATE POLICY "room_insert" ON public.chat_rooms FOR INSERT TO authenticated WITH CHECK (is_store_member(auth.uid(), store_id) AND created_by = auth.uid());

-- chat_room_members
CREATE POLICY "member_select" ON public.chat_room_members FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM chat_rooms cr WHERE cr.id = chat_room_members.room_id AND is_store_member(auth.uid(), cr.store_id)));
CREATE POLICY "member_insert" ON public.chat_room_members FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM chat_rooms cr WHERE cr.id = chat_room_members.room_id AND is_store_member(auth.uid(), cr.store_id)));

-- chat_messages
CREATE POLICY "msg_select" ON public.chat_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM chat_room_members crm WHERE crm.room_id = chat_messages.room_id AND crm.user_id = auth.uid()));
CREATE POLICY "msg_insert" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

-- chat_read_receipts
CREATE POLICY "receipt_select" ON public.chat_read_receipts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "receipt_update" ON public.chat_read_receipts FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "receipt_upsert" ON public.chat_read_receipts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 6. NEW TABLES
-- =====================================================

-- Shifts
CREATE TABLE public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  shift_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  break_minutes integer DEFAULT 0,
  role text,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shift_select" ON public.shifts FOR SELECT TO authenticated USING (is_store_member(auth.uid(), store_id) OR user_id = auth.uid());
CREATE POLICY "shift_insert" ON public.shifts FOR INSERT TO authenticated WITH CHECK (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role));
CREATE POLICY "shift_update" ON public.shifts FOR UPDATE TO authenticated USING (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role));
CREATE POLICY "shift_delete" ON public.shifts FOR DELETE TO authenticated USING (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role));

-- Checklist Templates
CREATE TABLE public.checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  checklist_type text NOT NULL,
  title text NOT NULL,
  description text,
  assigned_role text,
  requires_photo boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ct_select" ON public.checklist_templates FOR SELECT TO authenticated USING (is_store_member(auth.uid(), store_id));
CREATE POLICY "ct_insert" ON public.checklist_templates FOR INSERT TO authenticated WITH CHECK (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role));
CREATE POLICY "ct_update" ON public.checklist_templates FOR UPDATE TO authenticated USING (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role));
CREATE POLICY "ct_delete" ON public.checklist_templates FOR DELETE TO authenticated USING (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role));

-- Checklist Runs
CREATE TABLE public.checklist_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  business_date date NOT NULL DEFAULT CURRENT_DATE,
  assigned_user_id uuid,
  completed_by uuid,
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  note text,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.checklist_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_select" ON public.checklist_runs FOR SELECT TO authenticated USING (is_store_member(auth.uid(), store_id));
CREATE POLICY "cr_insert" ON public.checklist_runs FOR INSERT TO authenticated WITH CHECK (is_store_member(auth.uid(), store_id));
CREATE POLICY "cr_update" ON public.checklist_runs FOR UPDATE TO authenticated USING (is_store_member(auth.uid(), store_id));

-- Reservations
CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  reservation_source text DEFAULT 'manual',
  customer_name text NOT NULL,
  phone_number text,
  reservation_date date NOT NULL,
  reservation_time time NOT NULL,
  guest_count integer NOT NULL DEFAULT 2,
  seating_area text,
  status text NOT NULL DEFAULT '예약 확정',
  memo text,
  special_request text,
  vip_flag boolean DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "res_select" ON public.reservations FOR SELECT TO authenticated USING (is_store_member(auth.uid(), store_id));
CREATE POLICY "res_insert" ON public.reservations FOR INSERT TO authenticated WITH CHECK (is_store_member(auth.uid(), store_id));
CREATE POLICY "res_update" ON public.reservations FOR UPDATE TO authenticated USING (is_store_member(auth.uid(), store_id));
CREATE POLICY "res_delete" ON public.reservations FOR DELETE TO authenticated USING (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role));
