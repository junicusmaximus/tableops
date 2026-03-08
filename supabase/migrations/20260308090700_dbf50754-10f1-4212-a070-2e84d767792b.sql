
-- Inventory items master table with shortcodes and aliases
CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  english_name text,
  short_code text,
  aliases text[] DEFAULT '{}',
  category text NOT NULL DEFAULT '기타',
  item_type text NOT NULL DEFAULT 'raw',
  default_unit text DEFAULT 'kg',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inv_select" ON public.inventory_items FOR SELECT TO authenticated
  USING (is_store_member(auth.uid(), store_id));
CREATE POLICY "inv_insert" ON public.inventory_items FOR INSERT TO authenticated
  WITH CHECK (is_store_member(auth.uid(), store_id));
CREATE POLICY "inv_update" ON public.inventory_items FOR UPDATE TO authenticated
  USING (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role));
CREATE POLICY "inv_delete" ON public.inventory_items FOR DELETE TO authenticated
  USING (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role));

-- Usage history for memory-based ranking
CREATE TABLE public.item_usage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  query_text text,
  selected_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.item_usage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "iuh_select" ON public.item_usage_history FOR SELECT TO authenticated
  USING (is_store_member(auth.uid(), store_id));
CREATE POLICY "iuh_insert" ON public.item_usage_history FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_inventory_items_store ON public.inventory_items(store_id);
CREATE INDEX idx_inventory_items_short_code ON public.inventory_items(short_code);
CREATE INDEX idx_item_usage_history_user ON public.item_usage_history(user_id, item_id);
CREATE INDEX idx_item_usage_history_store ON public.item_usage_history(store_id, item_id);

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
