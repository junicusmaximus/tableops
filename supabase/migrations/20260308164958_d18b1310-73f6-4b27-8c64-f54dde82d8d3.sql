
-- 1. Create shift_swaps table
CREATE TABLE IF NOT EXISTS public.shift_swaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id),
  shift_id uuid NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL,
  accepter_id uuid,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid,
  chat_message_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shift_swaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ss_select" ON public.shift_swaps FOR SELECT TO authenticated
  USING (is_store_member(auth.uid(), store_id));
CREATE POLICY "ss_insert" ON public.shift_swaps FOR INSERT TO authenticated
  WITH CHECK (is_store_member(auth.uid(), store_id) AND requester_id = auth.uid());
CREATE POLICY "ss_update" ON public.shift_swaps FOR UPDATE TO authenticated
  USING (is_store_member(auth.uid(), store_id));

CREATE TRIGGER update_shift_swaps_updated_at
  BEFORE UPDATE ON public.shift_swaps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Add GPS columns to stores and attendance_logs
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS checkin_radius_meters integer DEFAULT 200;

ALTER TABLE public.attendance_logs
  ADD COLUMN IF NOT EXISTS checkin_latitude numeric,
  ADD COLUMN IF NOT EXISTS checkin_longitude numeric,
  ADD COLUMN IF NOT EXISTS is_outside_radius boolean DEFAULT false;
