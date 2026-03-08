
-- Fix has_role_or_higher to use explicit rank mapping instead of enum ordering
CREATE OR REPLACE FUNCTION public.has_role_or_higher(_user_id uuid, _min_role app_role)
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
          WHEN 'ceo' THEN 1
          WHEN 'owner' THEN 2
          WHEN 'boss' THEN 3
          WHEN 'manager' THEN 4
          WHEN 'full_time' THEN 5
          WHEN 'part_time' THEN 6
          WHEN 'kitchen_staff' THEN 7
          WHEN 'hall_staff' THEN 8
        END
      ) <= (
        CASE _min_role
          WHEN 'ceo' THEN 1
          WHEN 'owner' THEN 2
          WHEN 'boss' THEN 3
          WHEN 'manager' THEN 4
          WHEN 'full_time' THEN 5
          WHEN 'part_time' THEN 6
          WHEN 'kitchen_staff' THEN 7
          WHEN 'hall_staff' THEN 8
        END
      )
  );
$$;

-- Add manual entry fields to shifts table
ALTER TABLE public.shifts
  ADD COLUMN IF NOT EXISTS assignee_type text NOT NULL DEFAULT 'registered_user',
  ADD COLUMN IF NOT EXISTS manual_name text,
  ADD COLUMN IF NOT EXISTS manual_role_label text,
  ADD COLUMN IF NOT EXISTS manual_phone text;

-- Make user_id nullable for manual entries
ALTER TABLE public.shifts ALTER COLUMN user_id DROP NOT NULL;

-- Add validation trigger instead of check constraint
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

DROP TRIGGER IF EXISTS trg_validate_shift_assignee ON public.shifts;
CREATE TRIGGER trg_validate_shift_assignee
  BEFORE INSERT OR UPDATE ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION public.validate_shift_assignee();
