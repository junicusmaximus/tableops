
-- 1. Add stock tracking columns to inventory_items
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS current_stock numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS minimum_stock numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expiry_date date;

-- 2. Create purchase_requests table
CREATE TABLE IF NOT EXISTS public.purchase_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id),
  item_name text NOT NULL,
  item_id uuid REFERENCES public.inventory_items(id),
  quantity numeric NOT NULL DEFAULT 1,
  unit text DEFAULT 'kg',
  supplier text,
  notes text,
  requested_by uuid NOT NULL,
  approved_by uuid,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pr_select" ON public.purchase_requests
  FOR SELECT TO authenticated
  USING (is_store_member(auth.uid(), store_id));

CREATE POLICY "pr_insert" ON public.purchase_requests
  FOR INSERT TO authenticated
  WITH CHECK (is_store_member(auth.uid(), store_id) AND requested_by = auth.uid());

CREATE POLICY "pr_update" ON public.purchase_requests
  FOR UPDATE TO authenticated
  USING (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role));

-- 3. Create inventory_alerts table
CREATE TABLE IF NOT EXISTS public.inventory_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id),
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  alert_type text NOT NULL DEFAULT 'low_stock',
  message text NOT NULL,
  is_resolved boolean NOT NULL DEFAULT false,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ia_select" ON public.inventory_alerts
  FOR SELECT TO authenticated
  USING (is_store_member(auth.uid(), store_id));

CREATE POLICY "ia_insert" ON public.inventory_alerts
  FOR INSERT TO authenticated
  WITH CHECK (is_store_member(auth.uid(), store_id));

CREATE POLICY "ia_update" ON public.inventory_alerts
  FOR UPDATE TO authenticated
  USING (is_store_member(auth.uid(), store_id));

-- Trigger for updated_at on purchase_requests
CREATE TRIGGER update_purchase_requests_updated_at
  BEFORE UPDATE ON public.purchase_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
