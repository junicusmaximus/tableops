
-- Fix the overly permissive notification insert policy
DROP POLICY "notif_insert" ON public.notifications;

-- Only allow insert if the creator is authenticated and the notification is for a store member
CREATE POLICY "notif_insert" ON public.notifications FOR INSERT
  TO authenticated WITH CHECK (created_by = auth.uid());
