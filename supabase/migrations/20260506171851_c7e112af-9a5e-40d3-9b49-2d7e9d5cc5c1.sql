
-- Add active_version_id to document_templates
ALTER TABLE public.document_templates
  ADD COLUMN IF NOT EXISTS active_version_id uuid;

-- Add snapshot fields to document_requests
ALTER TABLE public.document_requests
  ADD COLUMN IF NOT EXISTS template_version_id uuid,
  ADD COLUMN IF NOT EXISTS variable_values_snapshot jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS document_schema_snapshot jsonb;

-- Template versions table
CREATE TABLE IF NOT EXISTS public.document_template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL,
  version_number integer NOT NULL DEFAULT 1,
  template_schema jsonb NOT NULL DEFAULT '{"blocks": []}'::jsonb,
  smart_variable_schema jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, version_number)
);

ALTER TABLE public.document_template_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY dtv_select ON public.document_template_versions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.document_templates t
    WHERE t.id = document_template_versions.template_id
      AND public.is_store_member(auth.uid(), t.store_id)
  ));

CREATE POLICY dtv_insert ON public.document_template_versions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.document_templates t
    WHERE t.id = document_template_versions.template_id
      AND public.is_store_member(auth.uid(), t.store_id)
      AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)
  ));

CREATE POLICY dtv_update ON public.document_template_versions
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.document_templates t
    WHERE t.id = document_template_versions.template_id
      AND public.is_store_member(auth.uid(), t.store_id)
      AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)
  ));

CREATE POLICY dtv_delete ON public.document_template_versions
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.document_templates t
    WHERE t.id = document_template_versions.template_id
      AND public.is_store_member(auth.uid(), t.store_id)
      AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)
  ));

CREATE TRIGGER trg_dtv_updated_at
  BEFORE UPDATE ON public.document_template_versions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Smart variables table
CREATE TABLE IF NOT EXISTS public.document_smart_variables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_version_id uuid NOT NULL REFERENCES public.document_template_versions(id) ON DELETE CASCADE,
  variable_key text NOT NULL,
  display_name text NOT NULL,
  description text,
  source_type text NOT NULL DEFAULT 'manual_sender',
  source_table text,
  source_column text,
  input_type text NOT NULL DEFAULT 'text',
  required boolean NOT NULL DEFAULT false,
  default_value text,
  editable_by text NOT NULL DEFAULT 'sender',
  allow_manual_override boolean NOT NULL DEFAULT true,
  validation_rule jsonb,
  is_custom boolean NOT NULL DEFAULT false,
  category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_version_id, variable_key)
);

ALTER TABLE public.document_smart_variables ENABLE ROW LEVEL SECURITY;

CREATE POLICY dsv_select ON public.document_smart_variables
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.document_template_versions v
    JOIN public.document_templates t ON t.id = v.template_id
    WHERE v.id = document_smart_variables.template_version_id
      AND public.is_store_member(auth.uid(), t.store_id)
  ));

CREATE POLICY dsv_insert ON public.document_smart_variables
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.document_template_versions v
    JOIN public.document_templates t ON t.id = v.template_id
    WHERE v.id = document_smart_variables.template_version_id
      AND public.is_store_member(auth.uid(), t.store_id)
      AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)
  ));

CREATE POLICY dsv_update ON public.document_smart_variables
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.document_template_versions v
    JOIN public.document_templates t ON t.id = v.template_id
    WHERE v.id = document_smart_variables.template_version_id
      AND public.is_store_member(auth.uid(), t.store_id)
      AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)
  ));

CREATE POLICY dsv_delete ON public.document_smart_variables
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.document_template_versions v
    JOIN public.document_templates t ON t.id = v.template_id
    WHERE v.id = document_smart_variables.template_version_id
      AND public.is_store_member(auth.uid(), t.store_id)
      AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)
  ));

CREATE TRIGGER trg_dsv_updated_at
  BEFORE UPDATE ON public.document_smart_variables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill: create v1 for every existing template
DO $$
DECLARE
  t record;
  v_id uuid;
BEGIN
  FOR t IN SELECT * FROM public.document_templates WHERE active_version_id IS NULL LOOP
    INSERT INTO public.document_template_versions
      (template_id, version_number, template_schema, smart_variable_schema, status, created_by)
    VALUES
      (t.id, 1, COALESCE(t.template_schema, '{"blocks": []}'::jsonb), '[]'::jsonb, 'active', t.created_by)
    RETURNING id INTO v_id;

    UPDATE public.document_templates SET active_version_id = v_id WHERE id = t.id;
  END LOOP;
END $$;

-- Backfill document_requests.template_version_id
UPDATE public.document_requests dr
SET template_version_id = t.active_version_id,
    document_schema_snapshot = COALESCE(dr.document_schema_snapshot, dr.document_schema)
FROM public.document_templates t
WHERE dr.template_id = t.id AND dr.template_version_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_dtv_template ON public.document_template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_dsv_version ON public.document_smart_variables(template_version_id);
