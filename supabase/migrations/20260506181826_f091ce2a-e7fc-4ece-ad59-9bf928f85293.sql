-- ============ Extend sales_records with transaction-level columns ============
ALTER TABLE public.sales_records
  ADD COLUMN IF NOT EXISTS organization_id uuid,
  ADD COLUMN IF NOT EXISTS business_date date,
  ADD COLUMN IF NOT EXISTS sales_datetime timestamptz,
  ADD COLUMN IF NOT EXISTS sales_hour smallint,
  ADD COLUMN IF NOT EXISTS weekday smallint,
  ADD COLUMN IF NOT EXISTS transaction_id text,
  ADD COLUMN IF NOT EXISTS order_id text,
  ADD COLUMN IF NOT EXISTS approval_time timestamptz,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS sales_channel text,
  ADD COLUMN IF NOT EXISTS gross_sales numeric,
  ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refund_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_sales numeric,
  ADD COLUMN IF NOT EXISTS vat_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS card_sales numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cash_sales numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_sales numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS alcohol_sales numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS raw_source_name text,
  ADD COLUMN IF NOT EXISTS memo text,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS import_batch_id uuid;

-- Backfill: business_date from date, net_sales from amount
UPDATE public.sales_records
  SET business_date = COALESCE(business_date, date),
      net_sales = COALESCE(net_sales, amount),
      created_by = COALESCE(created_by, recorded_by)
  WHERE business_date IS NULL OR net_sales IS NULL;

-- Trigger to auto-fill business_date / sales_hour / weekday
CREATE OR REPLACE FUNCTION public.fill_sales_record_derived()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.business_date IS NULL THEN
    NEW.business_date := COALESCE(NEW.date, (NEW.sales_datetime AT TIME ZONE 'Asia/Seoul')::date, CURRENT_DATE);
  END IF;
  IF NEW.date IS NULL THEN
    NEW.date := NEW.business_date;
  END IF;
  IF NEW.sales_datetime IS NOT NULL THEN
    NEW.sales_hour := EXTRACT(HOUR FROM NEW.sales_datetime AT TIME ZONE 'Asia/Seoul');
    NEW.weekday := EXTRACT(ISODOW FROM NEW.sales_datetime AT TIME ZONE 'Asia/Seoul') - 1; -- 0=Mon..6=Sun
  END IF;
  IF NEW.net_sales IS NULL THEN
    NEW.net_sales := NEW.amount;
  END IF;
  IF NEW.amount IS NULL THEN
    NEW.amount := COALESCE(NEW.net_sales, 0);
  END IF;
  IF NEW.organization_id IS NULL THEN
    SELECT s.organization_id INTO NEW.organization_id FROM public.stores s WHERE s.id = NEW.store_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fill_sales_record_derived ON public.sales_records;
CREATE TRIGGER trg_fill_sales_record_derived
  BEFORE INSERT OR UPDATE ON public.sales_records
  FOR EACH ROW EXECUTE FUNCTION public.fill_sales_record_derived();

CREATE INDEX IF NOT EXISTS idx_sales_records_store_date ON public.sales_records(store_id, business_date);
CREATE INDEX IF NOT EXISTS idx_sales_records_store_dt ON public.sales_records(store_id, sales_datetime);
CREATE INDEX IF NOT EXISTS idx_sales_records_org_date ON public.sales_records(organization_id, business_date);

-- ============ company_settings ============
CREATE TABLE IF NOT EXISTS public.company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE,
  allow_manager_sales_access boolean NOT NULL DEFAULT true,
  allow_manager_sales_detail_access boolean NOT NULL DEFAULT false,
  allow_manager_branch_comparison boolean NOT NULL DEFAULT false,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- ============ helper functions ============
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employee_profiles ep
    WHERE ep.user_id = _user_id AND ep.organization_id = _org_id
  ) OR EXISTS (
    SELECT 1 FROM public.user_store_roles WHERE user_id = _user_id AND role IN ('ceo'::app_role,'owner'::app_role)
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_sales_settings(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'ceo'::app_role)
     AND public.is_org_member(_user_id, _org_id);
$$;

CREATE OR REPLACE FUNCTION public.can_view_sales(_user_id uuid, _store_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _org uuid;
  _allow boolean;
BEGIN
  IF _user_id IS NULL OR _store_id IS NULL THEN RETURN false; END IF;
  -- CEO / Owner / Boss always allowed (within store membership rule for boss)
  IF public.has_role(_user_id, 'ceo'::app_role) OR public.has_role(_user_id, 'owner'::app_role) THEN
    RETURN true;
  END IF;
  IF public.has_role(_user_id, 'boss'::app_role) AND public.is_store_member(_user_id, _store_id) THEN
    RETURN true;
  END IF;
  -- Manager: only if company setting allows
  IF public.has_role(_user_id, 'manager'::app_role) AND public.is_store_member(_user_id, _store_id) THEN
    SELECT s.organization_id INTO _org FROM public.stores s WHERE s.id = _store_id;
    SELECT cs.allow_manager_sales_access INTO _allow FROM public.company_settings cs WHERE cs.organization_id = _org;
    RETURN COALESCE(_allow, true); -- default true if not configured
  END IF;
  RETURN false;
END;
$$;

-- company_settings RLS
DROP POLICY IF EXISTS cs_select ON public.company_settings;
CREATE POLICY cs_select ON public.company_settings FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
DROP POLICY IF EXISTS cs_insert ON public.company_settings;
CREATE POLICY cs_insert ON public.company_settings FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_sales_settings(auth.uid(), organization_id) AND updated_by = auth.uid());
DROP POLICY IF EXISTS cs_update ON public.company_settings;
CREATE POLICY cs_update ON public.company_settings FOR UPDATE TO authenticated
  USING (public.can_manage_sales_settings(auth.uid(), organization_id));

-- Replace sales_records RLS to enforce can_view_sales
DROP POLICY IF EXISTS "Users can view their store's sales" ON public.sales_records;
DROP POLICY IF EXISTS "Managers can insert sales" ON public.sales_records;
DROP POLICY IF EXISTS "Managers can update sales" ON public.sales_records;
DROP POLICY IF EXISTS "Managers can delete sales" ON public.sales_records;
DROP POLICY IF EXISTS sr_select ON public.sales_records;
DROP POLICY IF EXISTS sr_insert ON public.sales_records;
DROP POLICY IF EXISTS sr_update ON public.sales_records;
DROP POLICY IF EXISTS sr_delete ON public.sales_records;

ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY sr_select ON public.sales_records FOR SELECT TO authenticated
  USING (public.can_view_sales(auth.uid(), store_id));
CREATE POLICY sr_insert ON public.sales_records FOR INSERT TO authenticated
  WITH CHECK (public.can_view_sales(auth.uid(), store_id) AND public.has_role_or_higher(auth.uid(), 'manager'::app_role));
CREATE POLICY sr_update ON public.sales_records FOR UPDATE TO authenticated
  USING (public.can_view_sales(auth.uid(), store_id) AND public.has_role_or_higher(auth.uid(), 'manager'::app_role));
CREATE POLICY sr_delete ON public.sales_records FOR DELETE TO authenticated
  USING (public.can_view_sales(auth.uid(), store_id) AND public.has_role_or_higher(auth.uid(), 'manager'::app_role));

-- ============ sales_audit_logs ============
CREATE TABLE IF NOT EXISTS public.sales_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_role text,
  action_type text NOT NULL,
  store_id uuid,
  organization_id uuid,
  target_period text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY sal_insert ON public.sales_audit_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY sal_select ON public.sales_audit_logs FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'ceo'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role)
    OR (store_id IS NOT NULL AND public.is_store_member(auth.uid(), store_id) AND public.has_role_or_higher(auth.uid(), 'boss'::app_role))
  );

CREATE INDEX IF NOT EXISTS idx_sales_audit_logs_org_created ON public.sales_audit_logs(organization_id, created_at DESC);

-- ============ sales_import_batches ============
CREATE TABLE IF NOT EXISTS public.sales_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  uploaded_by uuid NOT NULL,
  file_name text,
  row_count integer NOT NULL DEFAULT 0,
  imported_count integer NOT NULL DEFAULT 0,
  duplicate_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'imported',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_import_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY sib_insert ON public.sales_import_batches FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid() AND public.can_view_sales(auth.uid(), store_id) AND public.has_role_or_higher(auth.uid(), 'manager'::app_role));
CREATE POLICY sib_select ON public.sales_import_batches FOR SELECT TO authenticated
  USING (public.can_view_sales(auth.uid(), store_id));
