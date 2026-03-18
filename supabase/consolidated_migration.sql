-- =============================================================================
-- TableOps Restaurant Management System — Consolidated Migration
-- =============================================================================
-- Generated from 25 migration files (20260303002116 → 20260309004752)
-- Target: Fresh Supabase project
-- Usage: Copy-paste into the Supabase SQL Editor and run in a single execution
--
-- Sections:
--   1.  Enum Types
--   2.  Core Tables (organizations, brands, stores)
--   3.  Employee & Role Tables
--   4.  Attendance Tables
--   5.  Chat Tables
--   6.  Sales Tables
--   7.  Shift & Schedule Tables
--   8.  Checklist Tables
--   9.  Reservation Table
--  10.  Inventory Tables
--  11.  Leave & Notification Tables
--  12.  Helper Functions (Security Definer — defined after all tables)
--  13.  Indexes
--  14.  Updated_at Trigger Function & Triggers
--  15.  Validation Triggers
--  16.  Row Level Security — Enable
--  17.  RLS Policies
--  18.  Auth Trigger: handle_new_user
--  19.  Storage Buckets & Policies
--  20.  Realtime
-- =============================================================================

-- =============================================================================
-- 1. ENUM TYPES
-- =============================================================================
-- Final state: 8-value enum (original 5-tier replaced with 4-tier in migration
-- 20260307024024, then extended to 8 values in 20260308093535)

CREATE TYPE public.app_role AS ENUM (
  'owner',
  'manager',
  'kitchen_staff',
  'hall_staff',
  'ceo',
  'boss',
  'full_time',
  'part_time'
);


-- =============================================================================
-- 2. CORE TABLES
-- =============================================================================

CREATE TABLE public.organizations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.brands (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- stores gains latitude/longitude/checkin_radius_meters in migration 20260308164958
CREATE TABLE public.stores (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id                UUID        NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  organization_id         UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name                    TEXT        NOT NULL,
  address                 TEXT,
  phone                   TEXT,
  latitude                NUMERIC,
  longitude               NUMERIC,
  checkin_radius_meters   INTEGER     DEFAULT 200,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
-- 3. EMPLOYEE & ROLE TABLES
-- =============================================================================

-- employee_profiles gains profile_image_url/bio/status in migration 20260308160323
-- user_id made nullable and invite columns added in migration 20260309004752
CREATE TABLE public.employee_profiles (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        REFERENCES auth.users(id) ON DELETE CASCADE,  -- nullable (invite flow)
  organization_id   UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  brand_id          UUID        NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  store_id          UUID        NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  full_name         TEXT        NOT NULL,
  phone             TEXT,
  position          TEXT,
  employment_type   TEXT        DEFAULT 'full_time',
  hire_date         DATE,
  profile_image_url TEXT,
  bio               TEXT,
  status            TEXT        NOT NULL DEFAULT 'offline',
  invite_status     TEXT        NOT NULL DEFAULT 'linked',
  invited_by        UUID,
  invited_at        TIMESTAMPTZ,
  linked_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, store_id)
);

CREATE TABLE public.user_store_roles (
  id         UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id   UUID            NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL DEFAULT 'hall_staff',
  created_at TIMESTAMPTZ     NOT NULL DEFAULT now(),
  UNIQUE(user_id, store_id)
);


-- =============================================================================
-- 4. ATTENDANCE TABLES
-- =============================================================================

-- attendance_logs gains GPS columns in migration 20260308164958
CREATE TABLE public.attendance_logs (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_profile_id UUID        NOT NULL REFERENCES public.employee_profiles(id) ON DELETE CASCADE,
  store_id            UUID        NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in_at         TIMESTAMPTZ,
  check_out_at        TIMESTAMPTZ,
  status              TEXT        NOT NULL DEFAULT 'checked_in',
  is_late             BOOLEAN     DEFAULT false,
  is_early_leave      BOOLEAN     DEFAULT false,
  scheduled_start     TIMESTAMPTZ,
  scheduled_end       TIMESTAMPTZ,
  work_hours          NUMERIC(5,2),
  notes               TEXT,
  date                DATE        NOT NULL DEFAULT CURRENT_DATE,
  checkin_latitude    NUMERIC,
  checkin_longitude   NUMERIC,
  is_outside_radius   BOOLEAN     DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.break_logs (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_log_id  UUID        NOT NULL REFERENCES public.attendance_logs(id) ON DELETE CASCADE,
  start_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_at             TIMESTAMPTZ,
  duration_minutes   NUMERIC(5,1),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
-- 5. CHAT TABLES
-- =============================================================================

-- chat_rooms gains pinned_message_id/pinned_at/pinned_by in migration 20260308164250
CREATE TABLE public.chat_rooms (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id          UUID        NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name              TEXT        NOT NULL,
  type              TEXT        NOT NULL DEFAULT 'group',  -- 'group', 'announcement'
  created_by        UUID        NOT NULL,
  pinned_message_id UUID,  -- FK added after chat_messages; set as self-ref below
  pinned_at         TIMESTAMPTZ,
  pinned_by         UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_room_members (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id   UUID        NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id   UUID        NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- chat_messages gains file_url/file_name/file_type in migration 20260308164250
CREATE TABLE public.chat_messages (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      UUID        NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id    UUID        NOT NULL,
  content      TEXT        NOT NULL,
  message_type TEXT        NOT NULL DEFAULT 'text',  -- 'text', 'system'
  file_url     TEXT,
  file_name    TEXT,
  file_type    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK for pinned_message_id now that chat_messages exists
ALTER TABLE public.chat_rooms
  ADD CONSTRAINT chat_rooms_pinned_message_id_fkey
  FOREIGN KEY (pinned_message_id) REFERENCES public.chat_messages(id);

CREATE TABLE public.chat_read_receipts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      UUID        NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- chat_mentions added in migration 20260308164250
CREATE TABLE public.chat_mentions (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id        UUID        NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  mentioned_user_id UUID        NOT NULL,
  room_id           UUID        NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
-- 6. SALES TABLES
-- =============================================================================

CREATE TABLE public.sales_targets (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      UUID        NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  year_month    TEXT        NOT NULL,  -- '2026-03'
  target_amount NUMERIC     NOT NULL DEFAULT 0,
  created_by    UUID        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, year_month)
);

CREATE TABLE public.sales_records (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID        NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  date        DATE        NOT NULL DEFAULT CURRENT_DATE,
  amount      NUMERIC     NOT NULL DEFAULT 0,
  notes       TEXT,
  recorded_by UUID        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, date)
);


-- =============================================================================
-- 7. SHIFT & SCHEDULE TABLES
-- =============================================================================

-- shifts gains assignee_type/manual_* columns and nullable user_id in migration 20260308124338
CREATE TABLE public.shifts (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id           UUID        NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id            UUID,  -- nullable for manual entries
  shift_date         DATE        NOT NULL,
  start_time         TIME        NOT NULL,
  end_time           TIME        NOT NULL,
  break_minutes      INTEGER     DEFAULT 0,
  role               TEXT,
  notes              TEXT,
  assignee_type      TEXT        NOT NULL DEFAULT 'registered_user',
  manual_name        TEXT,
  manual_role_label  TEXT,
  manual_phone       TEXT,
  created_by         UUID        NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.shift_templates (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      UUID        NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  start_time    TIME        NOT NULL,
  end_time      TIME        NOT NULL,
  break_minutes INTEGER     NOT NULL DEFAULT 0,
  role          TEXT,
  created_by    UUID        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- shift_swaps added in migration 20260308164958
CREATE TABLE public.shift_swaps (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID        NOT NULL REFERENCES public.stores(id),
  shift_id        UUID        NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  requester_id    UUID        NOT NULL,
  accepter_id     UUID,
  status          TEXT        NOT NULL DEFAULT 'pending',
  approved_by     UUID,
  chat_message_id UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
-- 8. CHECKLIST TABLES
-- =============================================================================

CREATE TABLE public.checklist_templates (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID        NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  checklist_type  TEXT        NOT NULL,
  title           TEXT        NOT NULL,
  description     TEXT,
  assigned_role   TEXT,
  requires_photo  BOOLEAN     DEFAULT false,
  sort_order      INTEGER     DEFAULT 0,
  is_active       BOOLEAN     DEFAULT true,
  created_by      UUID        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.checklist_runs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id      UUID        NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  store_id         UUID        NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  business_date    DATE        NOT NULL DEFAULT CURRENT_DATE,
  assigned_user_id UUID,
  completed_by     UUID,
  completed_at     TIMESTAMPTZ,
  status           TEXT        NOT NULL DEFAULT 'pending',
  note             TEXT,
  photo_url        TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
-- 9. RESERVATION TABLE
-- =============================================================================

CREATE TABLE public.reservations (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            UUID        NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  reservation_source  TEXT        DEFAULT 'manual',
  customer_name       TEXT        NOT NULL,
  phone_number        TEXT,
  reservation_date    DATE        NOT NULL,
  reservation_time    TIME        NOT NULL,
  guest_count         INTEGER     NOT NULL DEFAULT 2,
  seating_area        TEXT,
  status              TEXT        NOT NULL DEFAULT '예약 확정',
  memo                TEXT,
  special_request     TEXT,
  vip_flag            BOOLEAN     DEFAULT false,
  created_by          UUID        NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
-- 10. INVENTORY TABLES
-- =============================================================================

-- inventory_items gains current_stock/minimum_stock/expiry_date in migration 20260308164652
CREATE TABLE public.inventory_items (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID        NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  item_name       TEXT        NOT NULL,
  english_name    TEXT,
  short_code      TEXT,
  aliases         TEXT[]      DEFAULT '{}',
  category        TEXT        NOT NULL DEFAULT '기타',
  item_type       TEXT        NOT NULL DEFAULT 'raw',
  default_unit    TEXT        DEFAULT 'kg',
  current_stock   NUMERIC     DEFAULT 0,
  minimum_stock   NUMERIC     DEFAULT 0,
  expiry_date     DATE,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_by      UUID        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.item_usage_history (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL,
  store_id    UUID        NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  item_id     UUID        NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  query_text  TEXT,
  selected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.purchase_requests (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id     UUID        NOT NULL REFERENCES public.stores(id),
  item_name    TEXT        NOT NULL,
  item_id      UUID        REFERENCES public.inventory_items(id),
  quantity     NUMERIC     NOT NULL DEFAULT 1,
  unit         TEXT        DEFAULT 'kg',
  supplier     TEXT,
  notes        TEXT,
  requested_by UUID        NOT NULL,
  approved_by  UUID,
  status       TEXT        NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.inventory_alerts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id     UUID        NOT NULL REFERENCES public.stores(id),
  item_id      UUID        NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  alert_type   TEXT        NOT NULL DEFAULT 'low_stock',
  message      TEXT        NOT NULL,
  is_resolved  BOOLEAN     NOT NULL DEFAULT false,
  resolved_by  UUID,
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
-- 11. LEAVE & NOTIFICATION TABLES
-- =============================================================================

CREATE TABLE public.leave_requests (
  id                UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_user_id UUID        NOT NULL,
  store_id          UUID        NOT NULL REFERENCES public.stores(id),
  approver_user_id  UUID,
  leave_type        TEXT        NOT NULL DEFAULT '연차',
  start_date        DATE        NOT NULL,
  end_date          DATE        NOT NULL,
  reason            TEXT,
  status            TEXT        NOT NULL DEFAULT 'pending',
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.notifications (
  id                  UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID        NOT NULL,
  type                TEXT        NOT NULL,
  title               TEXT        NOT NULL,
  message             TEXT,
  related_entity_type TEXT,
  related_entity_id   UUID,
  is_read             BOOLEAN     NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by          UUID
);

-- notification_preferences gains additional enable_* columns in migration 20260308160323
CREATE TABLE public.notification_preferences (
  id                      UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                 UUID        NOT NULL UNIQUE,
  enable_all              BOOLEAN     NOT NULL DEFAULT true,
  enable_leave_request    BOOLEAN     NOT NULL DEFAULT true,
  enable_leave_result     BOOLEAN     NOT NULL DEFAULT true,
  enable_schedule_new     BOOLEAN     NOT NULL DEFAULT true,
  enable_schedule_change  BOOLEAN     NOT NULL DEFAULT true,
  enable_checklist        BOOLEAN     NOT NULL DEFAULT true,
  enable_inventory        BOOLEAN     NOT NULL DEFAULT true,
  enable_document_sign    BOOLEAN     NOT NULL DEFAULT true,
  enable_announcement     BOOLEAN     NOT NULL DEFAULT true,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
-- 12. HELPER FUNCTIONS (Security Definer — defined after all tables)
-- =============================================================================

-- Returns all store IDs the user is assigned to
CREATE OR REPLACE FUNCTION public.get_user_store_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT store_id FROM public.user_store_roles WHERE user_id = _user_id;
$$;

-- Returns all brand IDs the user's employee profiles belong to
CREATE OR REPLACE FUNCTION public.get_user_brand_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ep.brand_id FROM public.employee_profiles ep WHERE ep.user_id = _user_id;
$$;

-- Returns all organization IDs the user's employee profiles belong to
CREATE OR REPLACE FUNCTION public.get_user_org_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ep.organization_id FROM public.employee_profiles ep WHERE ep.user_id = _user_id;
$$;

-- Returns true if the user holds exactly the given role in any store
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_store_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Returns true if the user holds the given role or higher (lower numeric rank) in any store.
-- Rank order: ceo=1, owner=2, boss=3, manager=4, full_time=5, part_time=6, kitchen_staff=7, hall_staff=8
CREATE OR REPLACE FUNCTION public.has_role_or_higher(_user_id uuid, _min_role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_store_roles
    WHERE user_id = _user_id
      AND (
        CASE role
          WHEN 'ceo'          THEN 1
          WHEN 'owner'        THEN 2
          WHEN 'boss'         THEN 3
          WHEN 'manager'      THEN 4
          WHEN 'full_time'    THEN 5
          WHEN 'part_time'    THEN 6
          WHEN 'kitchen_staff' THEN 7
          WHEN 'hall_staff'   THEN 8
        END
      ) <= (
        CASE _min_role
          WHEN 'ceo'          THEN 1
          WHEN 'owner'        THEN 2
          WHEN 'boss'         THEN 3
          WHEN 'manager'      THEN 4
          WHEN 'full_time'    THEN 5
          WHEN 'part_time'    THEN 6
          WHEN 'kitchen_staff' THEN 7
          WHEN 'hall_staff'   THEN 8
        END
      )
  );
$$;

-- Returns the employee_profile id for a given user + store combination
CREATE OR REPLACE FUNCTION public.get_employee_profile_id(_user_id UUID, _store_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.employee_profiles WHERE user_id = _user_id AND store_id = _store_id LIMIT 1;
$$;

-- Returns true if the user is a store member OR holds an owner-level role (ceo/owner)
-- Final version from migration 20260308131316
CREATE OR REPLACE FUNCTION public.is_store_member(_user_id uuid, _store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_store_roles WHERE user_id = _user_id AND store_id = _store_id
  ) OR EXISTS (
    SELECT 1 FROM public.user_store_roles WHERE user_id = _user_id AND role IN ('ceo'::app_role, 'owner'::app_role)
  );
$$;


-- =============================================================================
-- 13. INDEXES
-- =============================================================================

-- employee_profiles
CREATE INDEX idx_employee_profiles_user_id  ON public.employee_profiles(user_id);
CREATE INDEX idx_employee_profiles_store_id ON public.employee_profiles(store_id);

-- user_store_roles
CREATE INDEX idx_user_store_roles_user_id  ON public.user_store_roles(user_id);
CREATE INDEX idx_user_store_roles_store_id ON public.user_store_roles(store_id);

-- attendance_logs
CREATE INDEX idx_attendance_logs_user_id  ON public.attendance_logs(user_id);
CREATE INDEX idx_attendance_logs_store_id ON public.attendance_logs(store_id);
CREATE INDEX idx_attendance_logs_date     ON public.attendance_logs(date);

-- break_logs
CREATE INDEX idx_break_logs_attendance ON public.break_logs(attendance_log_id);

-- chat
CREATE INDEX idx_chat_messages_room_id        ON public.chat_messages(room_id, created_at DESC);
CREATE INDEX idx_chat_room_members_user_id    ON public.chat_room_members(user_id);
CREATE INDEX idx_chat_read_receipts_user_room ON public.chat_read_receipts(user_id, room_id);

-- inventory
CREATE INDEX idx_inventory_items_store      ON public.inventory_items(store_id);
CREATE INDEX idx_inventory_items_short_code ON public.inventory_items(short_code);
CREATE INDEX idx_item_usage_history_user    ON public.item_usage_history(user_id, item_id);
CREATE INDEX idx_item_usage_history_store   ON public.item_usage_history(store_id, item_id);


-- =============================================================================
-- 14. UPDATED_AT TRIGGER FUNCTION & TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_profiles_updated_at
  BEFORE UPDATE ON public.employee_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_logs_updated_at
  BEFORE UPDATE ON public.attendance_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_sales_targets_updated_at
  BEFORE UPDATE ON public.sales_targets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_sales_records_updated_at
  BEFORE UPDATE ON public.sales_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_requests_updated_at
  BEFORE UPDATE ON public.purchase_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shift_swaps_updated_at
  BEFORE UPDATE ON public.shift_swaps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- =============================================================================
-- 15. VALIDATION TRIGGERS
-- =============================================================================

-- Validates shift assignee consistency (registered user vs manual entry)
CREATE OR REPLACE FUNCTION public.validate_shift_assignee()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.assignee_type = 'registered_user' AND NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required for registered_user assignee type';
  END IF;
  IF NEW.assignee_type = 'manual_entry' AND (NEW.manual_name IS NULL OR NEW.manual_name = '') THEN
    RAISE EXCEPTION 'manual_name is required for manual_entry assignee type';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_shift_assignee
  BEFORE INSERT OR UPDATE ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION public.validate_shift_assignee();


-- =============================================================================
-- 16. ROW LEVEL SECURITY — ENABLE
-- =============================================================================

ALTER TABLE public.organizations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_store_roles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.break_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_read_receipts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_mentions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_targets          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_records          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_templates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_swaps            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_templates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_runs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_usage_history     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_alerts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- 17. RLS POLICIES
-- Final state after all migrations resolved (last full rewrite: 20260307024024)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- organizations
-- -----------------------------------------------------------------------------
CREATE POLICY "org_select" ON public.organizations FOR SELECT TO authenticated
  USING (id IN (SELECT public.get_user_org_ids(auth.uid())) OR public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "org_manage" ON public.organizations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role));

-- -----------------------------------------------------------------------------
-- brands
-- -----------------------------------------------------------------------------
CREATE POLICY "brand_select" ON public.brands FOR SELECT TO authenticated
  USING (id IN (SELECT public.get_user_brand_ids(auth.uid())) OR public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "brand_manage" ON public.brands FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role));

-- -----------------------------------------------------------------------------
-- stores
-- -----------------------------------------------------------------------------
CREATE POLICY "store_select" ON public.stores FOR SELECT TO authenticated
  USING (id IN (SELECT public.get_user_store_ids(auth.uid())) OR public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "store_manage" ON public.stores FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role));

-- -----------------------------------------------------------------------------
-- employee_profiles
-- -----------------------------------------------------------------------------
CREATE POLICY "ep_select" ON public.employee_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_store_member(auth.uid(), store_id));

CREATE POLICY "ep_insert" ON public.employee_profiles FOR INSERT TO authenticated
  WITH CHECK (public.has_role_or_higher(auth.uid(), 'manager'::app_role));

CREATE POLICY "ep_update" ON public.employee_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role_or_higher(auth.uid(), 'manager'::app_role));

-- -----------------------------------------------------------------------------
-- user_store_roles
-- -----------------------------------------------------------------------------
CREATE POLICY "usr_select" ON public.user_store_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_store_member(auth.uid(), store_id));

CREATE POLICY "usr_manage" ON public.user_store_roles FOR ALL TO authenticated
  USING (public.has_role_or_higher(auth.uid(), 'manager'::app_role));

-- -----------------------------------------------------------------------------
-- attendance_logs
-- -----------------------------------------------------------------------------
CREATE POLICY "att_select" ON public.attendance_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_store_member(auth.uid(), store_id));

CREATE POLICY "att_insert" ON public.attendance_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "att_update" ON public.attendance_logs FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role_or_higher(auth.uid(), 'manager'::app_role));

-- -----------------------------------------------------------------------------
-- break_logs
-- -----------------------------------------------------------------------------
CREATE POLICY "brk_select" ON public.break_logs FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.attendance_logs al
    WHERE al.id = break_logs.attendance_log_id
      AND (al.user_id = auth.uid() OR public.is_store_member(auth.uid(), al.store_id))
  ));

CREATE POLICY "brk_insert" ON public.break_logs FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.attendance_logs al
    WHERE al.id = break_logs.attendance_log_id AND al.user_id = auth.uid()
  ));

CREATE POLICY "brk_update" ON public.break_logs FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.attendance_logs al
    WHERE al.id = break_logs.attendance_log_id AND al.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- chat_rooms
-- -----------------------------------------------------------------------------
CREATE POLICY "room_select" ON public.chat_rooms FOR SELECT TO authenticated
  USING (public.is_store_member(auth.uid(), store_id));

CREATE POLICY "room_insert" ON public.chat_rooms FOR INSERT TO authenticated
  WITH CHECK (public.is_store_member(auth.uid(), store_id) AND created_by = auth.uid());

-- Managers can pin messages (added in migration 20260308164250)
CREATE POLICY "room_update_pin" ON public.chat_rooms FOR UPDATE TO authenticated
  USING (public.is_store_member(auth.uid(), store_id) AND public.has_role_or_higher(auth.uid(), 'manager'::app_role))
  WITH CHECK (public.is_store_member(auth.uid(), store_id) AND public.has_role_or_higher(auth.uid(), 'manager'::app_role));

-- -----------------------------------------------------------------------------
-- chat_room_members
-- -----------------------------------------------------------------------------
CREATE POLICY "member_select" ON public.chat_room_members FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.chat_rooms cr
    WHERE cr.id = chat_room_members.room_id AND public.is_store_member(auth.uid(), cr.store_id)
  ));

CREATE POLICY "member_insert" ON public.chat_room_members FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.chat_rooms cr
    WHERE cr.id = chat_room_members.room_id AND public.is_store_member(auth.uid(), cr.store_id)
  ));

-- -----------------------------------------------------------------------------
-- chat_messages
-- -----------------------------------------------------------------------------
CREATE POLICY "msg_select" ON public.chat_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.chat_room_members crm
    WHERE crm.room_id = chat_messages.room_id AND crm.user_id = auth.uid()
  ));

CREATE POLICY "msg_insert" ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- -----------------------------------------------------------------------------
-- chat_read_receipts
-- -----------------------------------------------------------------------------
CREATE POLICY "receipt_select" ON public.chat_read_receipts FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "receipt_upsert" ON public.chat_read_receipts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "receipt_update" ON public.chat_read_receipts FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- chat_mentions
-- -----------------------------------------------------------------------------
CREATE POLICY "mention_select" ON public.chat_mentions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.chat_room_members crm
    WHERE crm.room_id = chat_mentions.room_id AND crm.user_id = auth.uid()
  ));

CREATE POLICY "mention_insert" ON public.chat_mentions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.chat_room_members crm
    WHERE crm.room_id = chat_mentions.room_id AND crm.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- sales_targets
-- -----------------------------------------------------------------------------
CREATE POLICY "st_select" ON public.sales_targets FOR SELECT TO authenticated
  USING (public.is_store_member(auth.uid(), store_id));

CREATE POLICY "st_insert" ON public.sales_targets FOR INSERT TO authenticated
  WITH CHECK (
    public.is_store_member(auth.uid(), store_id)
    AND created_by = auth.uid()
    AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)
  );

CREATE POLICY "st_update" ON public.sales_targets FOR UPDATE TO authenticated
  USING (
    public.is_store_member(auth.uid(), store_id)
    AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)
  );

-- -----------------------------------------------------------------------------
-- sales_records
-- -----------------------------------------------------------------------------
CREATE POLICY "sr_select" ON public.sales_records FOR SELECT TO authenticated
  USING (public.is_store_member(auth.uid(), store_id));

CREATE POLICY "sr_insert" ON public.sales_records FOR INSERT TO authenticated
  WITH CHECK (public.is_store_member(auth.uid(), store_id) AND recorded_by = auth.uid());

CREATE POLICY "sr_update" ON public.sales_records FOR UPDATE TO authenticated
  USING (public.is_store_member(auth.uid(), store_id));

CREATE POLICY "sr_delete" ON public.sales_records FOR DELETE TO authenticated
  USING (
    public.is_store_member(auth.uid(), store_id)
    AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)
  );

-- -----------------------------------------------------------------------------
-- shifts
-- -----------------------------------------------------------------------------
CREATE POLICY "shift_select" ON public.shifts FOR SELECT TO authenticated
  USING (public.is_store_member(auth.uid(), store_id) OR user_id = auth.uid());

CREATE POLICY "shift_insert" ON public.shifts FOR INSERT TO authenticated
  WITH CHECK (
    public.is_store_member(auth.uid(), store_id)
    AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)
  );

CREATE POLICY "shift_update" ON public.shifts FOR UPDATE TO authenticated
  USING (
    public.is_store_member(auth.uid(), store_id)
    AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)
  );

CREATE POLICY "shift_delete" ON public.shifts FOR DELETE TO authenticated
  USING (
    public.is_store_member(auth.uid(), store_id)
    AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)
  );

-- -----------------------------------------------------------------------------
-- shift_templates
-- Note: uses "st_" prefix; no conflict with sales_targets on shift_templates table
-- -----------------------------------------------------------------------------
CREATE POLICY "st_select" ON public.shift_templates FOR SELECT TO authenticated
  USING (public.is_store_member(auth.uid(), store_id));

CREATE POLICY "st_insert" ON public.shift_templates FOR INSERT TO authenticated
  WITH CHECK (
    public.is_store_member(auth.uid(), store_id)
    AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)
  );

CREATE POLICY "st_update" ON public.shift_templates FOR UPDATE TO authenticated
  USING (
    public.is_store_member(auth.uid(), store_id)
    AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)
  );

CREATE POLICY "st_delete" ON public.shift_templates FOR DELETE TO authenticated
  USING (
    public.is_store_member(auth.uid(), store_id)
    AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)
  );

-- -----------------------------------------------------------------------------
-- shift_swaps
-- -----------------------------------------------------------------------------
CREATE POLICY "ss_select" ON public.shift_swaps FOR SELECT TO authenticated
  USING (public.is_store_member(auth.uid(), store_id));

CREATE POLICY "ss_insert" ON public.shift_swaps FOR INSERT TO authenticated
  WITH CHECK (public.is_store_member(auth.uid(), store_id) AND requester_id = auth.uid());

CREATE POLICY "ss_update" ON public.shift_swaps FOR UPDATE TO authenticated
  USING (public.is_store_member(auth.uid(), store_id));

-- -----------------------------------------------------------------------------
-- checklist_templates
-- -----------------------------------------------------------------------------
CREATE POLICY "ct_select" ON public.checklist_templates FOR SELECT TO authenticated
  USING (public.is_store_member(auth.uid(), store_id));

CREATE POLICY "ct_insert" ON public.checklist_templates FOR INSERT TO authenticated
  WITH CHECK (
    public.is_store_member(auth.uid(), store_id)
    AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)
  );

CREATE POLICY "ct_update" ON public.checklist_templates FOR UPDATE TO authenticated
  USING (
    public.is_store_member(auth.uid(), store_id)
    AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)
  );

CREATE POLICY "ct_delete" ON public.checklist_templates FOR DELETE TO authenticated
  USING (
    public.is_store_member(auth.uid(), store_id)
    AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)
  );

-- -----------------------------------------------------------------------------
-- checklist_runs
-- -----------------------------------------------------------------------------
CREATE POLICY "cr_select" ON public.checklist_runs FOR SELECT TO authenticated
  USING (public.is_store_member(auth.uid(), store_id));

CREATE POLICY "cr_insert" ON public.checklist_runs FOR INSERT TO authenticated
  WITH CHECK (public.is_store_member(auth.uid(), store_id));

CREATE POLICY "cr_update" ON public.checklist_runs FOR UPDATE TO authenticated
  USING (public.is_store_member(auth.uid(), store_id));

-- -----------------------------------------------------------------------------
-- reservations
-- -----------------------------------------------------------------------------
CREATE POLICY "res_select" ON public.reservations FOR SELECT TO authenticated
  USING (public.is_store_member(auth.uid(), store_id));

CREATE POLICY "res_insert" ON public.reservations FOR INSERT TO authenticated
  WITH CHECK (public.is_store_member(auth.uid(), store_id));

CREATE POLICY "res_update" ON public.reservations FOR UPDATE TO authenticated
  USING (public.is_store_member(auth.uid(), store_id));

CREATE POLICY "res_delete" ON public.reservations FOR DELETE TO authenticated
  USING (
    public.is_store_member(auth.uid(), store_id)
    AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)
  );

-- -----------------------------------------------------------------------------
-- inventory_items
-- -----------------------------------------------------------------------------
CREATE POLICY "inv_select" ON public.inventory_items FOR SELECT TO authenticated
  USING (public.is_store_member(auth.uid(), store_id));

CREATE POLICY "inv_insert" ON public.inventory_items FOR INSERT TO authenticated
  WITH CHECK (public.is_store_member(auth.uid(), store_id));

CREATE POLICY "inv_update" ON public.inventory_items FOR UPDATE TO authenticated
  USING (
    public.is_store_member(auth.uid(), store_id)
    AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)
  );

CREATE POLICY "inv_delete" ON public.inventory_items FOR DELETE TO authenticated
  USING (
    public.is_store_member(auth.uid(), store_id)
    AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)
  );

-- -----------------------------------------------------------------------------
-- item_usage_history
-- -----------------------------------------------------------------------------
CREATE POLICY "iuh_select" ON public.item_usage_history FOR SELECT TO authenticated
  USING (public.is_store_member(auth.uid(), store_id));

CREATE POLICY "iuh_insert" ON public.item_usage_history FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- purchase_requests
-- -----------------------------------------------------------------------------
CREATE POLICY "pr_select" ON public.purchase_requests FOR SELECT TO authenticated
  USING (public.is_store_member(auth.uid(), store_id));

CREATE POLICY "pr_insert" ON public.purchase_requests FOR INSERT TO authenticated
  WITH CHECK (public.is_store_member(auth.uid(), store_id) AND requested_by = auth.uid());

CREATE POLICY "pr_update" ON public.purchase_requests FOR UPDATE TO authenticated
  USING (
    public.is_store_member(auth.uid(), store_id)
    AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)
  );

-- -----------------------------------------------------------------------------
-- inventory_alerts
-- -----------------------------------------------------------------------------
CREATE POLICY "ia_select" ON public.inventory_alerts FOR SELECT TO authenticated
  USING (public.is_store_member(auth.uid(), store_id));

CREATE POLICY "ia_insert" ON public.inventory_alerts FOR INSERT TO authenticated
  WITH CHECK (public.is_store_member(auth.uid(), store_id));

CREATE POLICY "ia_update" ON public.inventory_alerts FOR UPDATE TO authenticated
  USING (public.is_store_member(auth.uid(), store_id));

-- -----------------------------------------------------------------------------
-- leave_requests
-- -----------------------------------------------------------------------------
CREATE POLICY "lr_select_own" ON public.leave_requests FOR SELECT TO authenticated
  USING (applicant_user_id = auth.uid() OR public.is_store_member(auth.uid(), store_id));

CREATE POLICY "lr_insert" ON public.leave_requests FOR INSERT TO authenticated
  WITH CHECK (applicant_user_id = auth.uid() AND public.is_store_member(auth.uid(), store_id));

CREATE POLICY "lr_update" ON public.leave_requests FOR UPDATE TO authenticated
  USING (
    (applicant_user_id = auth.uid())
    OR (public.is_store_member(auth.uid(), store_id) AND public.has_role_or_higher(auth.uid(), 'manager'::app_role))
  );

-- -----------------------------------------------------------------------------
-- notifications
-- -----------------------------------------------------------------------------
CREATE POLICY "notif_select" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Final version (migration 20260308154558): creator must be the authenticated user
CREATE POLICY "notif_insert" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "notif_update" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- notification_preferences
-- -----------------------------------------------------------------------------
CREATE POLICY "np_select" ON public.notification_preferences FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "np_insert" ON public.notification_preferences FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "np_update" ON public.notification_preferences FOR UPDATE TO authenticated
  USING (user_id = auth.uid());


-- =============================================================================
-- 18. AUTH TRIGGER: handle_new_user
-- Final version from migration 20260309004752
-- Links new users to pending employee profiles, or auto-creates org/brand/store
-- =============================================================================

-- Helper function: links a new user to a pending employee profile by phone match
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

  -- Create user_store_role from the pending employee's position column as app_role
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

-- Main auth trigger function
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
  _role      := COALESCE(NEW.raw_user_meta_data->>'role', 'part_time');
  _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  _phone     := COALESCE(NEW.raw_user_meta_data->>'phone', '');

  -- Attempt to link to a pending employee profile first (invite flow)
  IF _phone IS NOT NULL AND _phone != '' THEN
    _link_result := public.link_pending_employee(NEW.id, _phone, _full_name);
    IF (_link_result->>'linked')::boolean = true THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Map string role to app_role enum
  _app_role := _role::app_role;

  -- Auto-create organization, brand, store
  IF _role IN ('ceo', 'owner', 'boss', 'manager') THEN
    INSERT INTO public.organizations (name) VALUES (_full_name || '의 조직') RETURNING id INTO _org_id;
    INSERT INTO public.brands (name, organization_id) VALUES (_full_name || '의 브랜드', _org_id) RETURNING id INTO _brand_id;
    INSERT INTO public.stores (name, brand_id, organization_id) VALUES (_full_name || '의 매장', _brand_id, _org_id) RETURNING id INTO _store_id;
  ELSE
    -- Staff roles get a placeholder org/brand/store (they are normally invited by a manager)
    INSERT INTO public.organizations (name) VALUES ('기본 조직') RETURNING id INTO _org_id;
    INSERT INTO public.brands (name, organization_id) VALUES ('기본 브랜드', _org_id) RETURNING id INTO _brand_id;
    INSERT INTO public.stores (name, brand_id, organization_id) VALUES ('기본 매장', _brand_id, _org_id) RETURNING id INTO _store_id;
  END IF;

  -- Create employee profile
  INSERT INTO public.employee_profiles (
    user_id, full_name, phone, store_id, brand_id, organization_id,
    position, employment_type, invite_status, linked_at, status
  )
  VALUES (
    NEW.id, _full_name, _phone, _store_id, _brand_id, _org_id, _role,
    CASE WHEN _role IN ('full_time', 'ceo', 'owner', 'boss', 'manager') THEN 'full_time' ELSE 'part_time' END,
    'linked', now(), 'active'
  );

  -- Create user store role
  INSERT INTO public.user_store_roles (user_id, store_id, role)
  VALUES (NEW.id, _store_id, _app_role);

  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =============================================================================
-- 19. STORAGE BUCKETS & POLICIES
-- =============================================================================

-- Avatars bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Avatars are publicly accessible"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Chat files bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat_files', 'chat_files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "chat_files_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'chat_files');

CREATE POLICY "chat_files_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'chat_files');


-- =============================================================================
-- 20. REALTIME
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;


-- =============================================================================
-- END OF CONSOLIDATED MIGRATION
-- =============================================================================
