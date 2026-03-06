
-- Drop all restrictive policies and recreate as permissive

-- chat_rooms
DROP POLICY IF EXISTS "room_insert" ON public.chat_rooms;
DROP POLICY IF EXISTS "room_select" ON public.chat_rooms;
CREATE POLICY "room_insert" ON public.chat_rooms FOR INSERT TO authenticated
  WITH CHECK (is_store_member(auth.uid(), store_id) AND created_by = auth.uid());
CREATE POLICY "room_select" ON public.chat_rooms FOR SELECT TO authenticated
  USING (is_store_member(auth.uid(), store_id));

-- chat_room_members
DROP POLICY IF EXISTS "member_insert" ON public.chat_room_members;
DROP POLICY IF EXISTS "member_select" ON public.chat_room_members;
CREATE POLICY "member_insert" ON public.chat_room_members FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.chat_rooms cr WHERE cr.id = chat_room_members.room_id AND is_store_member(auth.uid(), cr.store_id)
  ));
CREATE POLICY "member_select" ON public.chat_room_members FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.chat_rooms cr WHERE cr.id = chat_room_members.room_id AND is_store_member(auth.uid(), cr.store_id)
  ));

-- chat_messages
DROP POLICY IF EXISTS "msg_insert" ON public.chat_messages;
DROP POLICY IF EXISTS "msg_select" ON public.chat_messages;
CREATE POLICY "msg_insert" ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());
CREATE POLICY "msg_select" ON public.chat_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.chat_room_members crm WHERE crm.room_id = chat_messages.room_id AND crm.user_id = auth.uid()
  ));

-- chat_read_receipts
DROP POLICY IF EXISTS "receipt_select" ON public.chat_read_receipts;
DROP POLICY IF EXISTS "receipt_update" ON public.chat_read_receipts;
DROP POLICY IF EXISTS "receipt_upsert" ON public.chat_read_receipts;
CREATE POLICY "receipt_select" ON public.chat_read_receipts FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "receipt_update" ON public.chat_read_receipts FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "receipt_upsert" ON public.chat_read_receipts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
