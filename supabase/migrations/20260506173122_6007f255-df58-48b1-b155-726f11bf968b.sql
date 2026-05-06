
CREATE TABLE public.access_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  provider text NOT NULL,
  provider_label text,
  integration_mode text NOT NULL DEFAULT 'csv_import',
  api_base_url text,
  api_key text,
  secret_key text,
  local_export_path text,
  sync_frequency text DEFAULT 'manual',
  is_active boolean NOT NULL DEFAULT true,
  last_sync_at timestamptz,
  last_sync_status text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_access_integrations_store ON public.access_integrations(store_id);
ALTER TABLE public.access_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_select ON public.access_integrations FOR SELECT TO authenticated
  USING (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role));
CREATE POLICY ai_insert ON public.access_integrations FOR INSERT TO authenticated
  WITH CHECK (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role) AND created_by = auth.uid());
CREATE POLICY ai_update ON public.access_integrations FOR UPDATE TO authenticated
  USING (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role));
CREATE POLICY ai_delete ON public.access_integrations FOR DELETE TO authenticated
  USING (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role));
CREATE TRIGGER trg_access_integrations_updated BEFORE UPDATE ON public.access_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.access_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  provider text NOT NULL,
  uploaded_by uuid NOT NULL,
  file_name text,
  row_count integer NOT NULL DEFAULT 0,
  matched_count integer NOT NULL DEFAULT 0,
  unmatched_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'imported',
  imported_at timestamptz NOT NULL DEFAULT now(),
  notes text
);
CREATE INDEX idx_aib_store ON public.access_import_batches(store_id);
ALTER TABLE public.access_import_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY aib_select ON public.access_import_batches FOR SELECT TO authenticated
  USING (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role));
CREATE POLICY aib_insert ON public.access_import_batches FOR INSERT TO authenticated
  WITH CHECK (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role) AND uploaded_by = auth.uid());

CREATE TABLE public.access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  provider text NOT NULL,
  employee_profile_id uuid,
  raw_employee_name text,
  employee_number text,
  access_card_number text,
  provider_user_id text,
  access_datetime timestamptz NOT NULL,
  access_date date NOT NULL,
  access_type text,
  device_name text,
  door_name text,
  import_batch_id uuid,
  raw_payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_access_logs_store_date ON public.access_logs(store_id, access_date);
CREATE INDEX idx_access_logs_employee ON public.access_logs(employee_profile_id, access_date);
CREATE INDEX idx_access_logs_batch ON public.access_logs(import_batch_id);
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY al_select ON public.access_logs FOR SELECT TO authenticated
  USING (
    (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role))
    OR employee_profile_id IN (SELECT id FROM employee_profiles WHERE user_id = auth.uid())
  );
CREATE POLICY al_insert ON public.access_logs FOR INSERT TO authenticated
  WITH CHECK (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role));
CREATE POLICY al_update ON public.access_logs FOR UPDATE TO authenticated
  USING (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role));
CREATE POLICY al_delete ON public.access_logs FOR DELETE TO authenticated
  USING (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role));

ALTER TABLE public.employee_profiles
  ADD COLUMN IF NOT EXISTS employee_number text,
  ADD COLUMN IF NOT EXISTS access_card_number text,
  ADD COLUMN IF NOT EXISTS access_provider text,
  ADD COLUMN IF NOT EXISTS access_provider_user_id text,
  ADD COLUMN IF NOT EXISTS access_consent_accepted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_consent_accepted_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_ep_employee_number ON public.employee_profiles(store_id, employee_number);
CREATE INDEX IF NOT EXISTS idx_ep_card_number ON public.employee_profiles(store_id, access_card_number);

ALTER TABLE public.attendance_logs
  ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'app_check',
  ADD COLUMN IF NOT EXISTS source_provider text,
  ADD COLUMN IF NOT EXISTS source_access_log_id uuid,
  ADD COLUMN IF NOT EXISTS confidence_score numeric,
  ADD COLUMN IF NOT EXISTS access_check_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS access_check_out_at timestamptz,
  ADD COLUMN IF NOT EXISTS reconciliation_status text,
  ADD COLUMN IF NOT EXISTS reconciliation_note text,
  ADD COLUMN IF NOT EXISTS reconciled_by uuid,
  ADD COLUMN IF NOT EXISTS reconciled_at timestamptz,
  ADD COLUMN IF NOT EXISTS synced_at timestamptz;

ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS enable_access_integration boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_attendance_mismatch boolean NOT NULL DEFAULT true;
