
-- Drop restrictive policies on sales_records
DROP POLICY IF EXISTS "sr_select" ON public.sales_records;
DROP POLICY IF EXISTS "sr_insert" ON public.sales_records;
DROP POLICY IF EXISTS "sr_update" ON public.sales_records;
DROP POLICY IF EXISTS "sr_delete" ON public.sales_records;

-- Drop restrictive policies on sales_targets
DROP POLICY IF EXISTS "st_select" ON public.sales_targets;
DROP POLICY IF EXISTS "st_insert" ON public.sales_targets;
DROP POLICY IF EXISTS "st_update" ON public.sales_targets;

-- Recreate as PERMISSIVE on sales_records
CREATE POLICY "sr_select" ON public.sales_records FOR SELECT TO authenticated
  USING (is_store_member(auth.uid(), store_id));

CREATE POLICY "sr_insert" ON public.sales_records FOR INSERT TO authenticated
  WITH CHECK (is_store_member(auth.uid(), store_id) AND recorded_by = auth.uid());

CREATE POLICY "sr_update" ON public.sales_records FOR UPDATE TO authenticated
  USING (is_store_member(auth.uid(), store_id));

CREATE POLICY "sr_delete" ON public.sales_records FOR DELETE TO authenticated
  USING (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'store_manager'::app_role));

-- Recreate as PERMISSIVE on sales_targets
CREATE POLICY "st_select" ON public.sales_targets FOR SELECT TO authenticated
  USING (is_store_member(auth.uid(), store_id));

CREATE POLICY "st_insert" ON public.sales_targets FOR INSERT TO authenticated
  WITH CHECK (is_store_member(auth.uid(), store_id) AND created_by = auth.uid() AND has_role_or_higher(auth.uid(), 'store_manager'::app_role));

CREATE POLICY "st_update" ON public.sales_targets FOR UPDATE TO authenticated
  USING (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'store_manager'::app_role));
