
CREATE TABLE public.ai_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  period_type text NOT NULL DEFAULT 'daily',
  period_start date NOT NULL,
  period_end date NOT NULL,
  report_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_reports_store_period ON public.ai_reports (store_id, period_type, period_start, period_end);

ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_reports_select" ON public.ai_reports
  FOR SELECT TO authenticated
  USING (is_store_member(auth.uid(), store_id));

CREATE POLICY "ai_reports_insert" ON public.ai_reports
  FOR INSERT TO authenticated
  WITH CHECK (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role));

CREATE POLICY "ai_reports_delete" ON public.ai_reports
  FOR DELETE TO authenticated
  USING (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role));
