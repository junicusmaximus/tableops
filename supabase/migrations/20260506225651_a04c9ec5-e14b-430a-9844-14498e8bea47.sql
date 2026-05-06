-- 1) Tighten chat_messages INSERT for announcement rooms
DROP POLICY IF EXISTS msg_insert ON public.chat_messages;
CREATE POLICY msg_insert ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chat_room_members crm
      WHERE crm.room_id = chat_messages.room_id AND crm.user_id = auth.uid()
    )
    AND (
      NOT EXISTS (
        SELECT 1 FROM public.chat_rooms cr
        WHERE cr.id = chat_messages.room_id AND cr.is_announcement = true
      )
      OR public.has_role_or_higher(auth.uid(), 'manager'::app_role)
    )
  );

-- 2) Sync employee_profiles.status from attendance_logs
CREATE OR REPLACE FUNCTION public.tg_sync_employee_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.check_out_at IS NOT NULL THEN
    UPDATE public.employee_profiles
      SET status = 'offline', updated_at = now()
      WHERE id = NEW.employee_profile_id;
  ELSIF NEW.check_in_at IS NOT NULL THEN
    UPDATE public.employee_profiles
      SET status = 'working', updated_at = now()
      WHERE id = NEW.employee_profile_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS attendance_sync_status_ins ON public.attendance_logs;
CREATE TRIGGER attendance_sync_status_ins
  AFTER INSERT ON public.attendance_logs
  FOR EACH ROW EXECUTE FUNCTION public.tg_sync_employee_status();

DROP TRIGGER IF EXISTS attendance_sync_status_upd ON public.attendance_logs;
CREATE TRIGGER attendance_sync_status_upd
  AFTER UPDATE OF check_in_at, check_out_at ON public.attendance_logs
  FOR EACH ROW EXECUTE FUNCTION public.tg_sync_employee_status();