
-- Monthly sales targets per store
CREATE TABLE public.sales_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  year_month text NOT NULL, -- '2026-03'
  target_amount numeric NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id, year_month)
);

-- Daily sales records per store
CREATE TABLE public.sales_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric NOT NULL DEFAULT 0,
  notes text,
  recorded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id, date)
);

-- Enable RLS
ALTER TABLE public.sales_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;

-- RLS for sales_targets
CREATE POLICY "st_select" ON public.sales_targets FOR SELECT TO authenticated
  USING (is_store_member(auth.uid(), store_id));
CREATE POLICY "st_insert" ON public.sales_targets FOR INSERT TO authenticated
  WITH CHECK (is_store_member(auth.uid(), store_id) AND created_by = auth.uid() AND has_role_or_higher(auth.uid(), 'store_manager'::app_role));
CREATE POLICY "st_update" ON public.sales_targets FOR UPDATE TO authenticated
  USING (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'store_manager'::app_role));

-- RLS for sales_records
CREATE POLICY "sr_select" ON public.sales_records FOR SELECT TO authenticated
  USING (is_store_member(auth.uid(), store_id));
CREATE POLICY "sr_insert" ON public.sales_records FOR INSERT TO authenticated
  WITH CHECK (is_store_member(auth.uid(), store_id) AND recorded_by = auth.uid());
CREATE POLICY "sr_update" ON public.sales_records FOR UPDATE TO authenticated
  USING (is_store_member(auth.uid(), store_id));
CREATE POLICY "sr_delete" ON public.sales_records FOR DELETE TO authenticated
  USING (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'store_manager'::app_role));

-- Updated_at triggers
CREATE TRIGGER set_sales_targets_updated_at BEFORE UPDATE ON public.sales_targets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_sales_records_updated_at BEFORE UPDATE ON public.sales_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
