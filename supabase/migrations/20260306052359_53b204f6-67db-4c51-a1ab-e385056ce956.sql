
-- Fix chat_room_members member_select: was crm.room_id = crm.room_id (self-ref)
DROP POLICY IF EXISTS "member_select" ON public.chat_room_members;
CREATE POLICY "member_select" ON public.chat_room_members
  AS restrictive FOR SELECT TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM public.chat_room_members m2
      WHERE m2.room_id = chat_room_members.room_id AND m2.user_id = auth.uid()
    ))
    OR
    (EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = chat_room_members.room_id AND is_store_member(auth.uid(), cr.store_id)
    ))
  );

-- Fix chat_messages msg_select: was crm.room_id = crm.room_id (self-ref)
DROP POLICY IF EXISTS "msg_select" ON public.chat_messages;
CREATE POLICY "msg_select" ON public.chat_messages
  AS restrictive FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_room_members crm
      WHERE crm.room_id = chat_messages.room_id AND crm.user_id = auth.uid()
    )
  );

-- Fix chat_rooms room_select: was crm.room_id = crm.id (self-ref)
DROP POLICY IF EXISTS "room_select" ON public.chat_rooms;
CREATE POLICY "room_select" ON public.chat_rooms
  AS restrictive FOR SELECT TO authenticated
  USING (
    is_store_member(auth.uid(), store_id)
  );
