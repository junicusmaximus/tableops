
-- 1. Add file columns to chat_messages
ALTER TABLE public.chat_messages 
  ADD COLUMN IF NOT EXISTS file_url text,
  ADD COLUMN IF NOT EXISTS file_name text,
  ADD COLUMN IF NOT EXISTS file_type text;

-- 2. Add pinned message columns to chat_rooms
ALTER TABLE public.chat_rooms
  ADD COLUMN IF NOT EXISTS pinned_message_id uuid REFERENCES public.chat_messages(id),
  ADD COLUMN IF NOT EXISTS pinned_at timestamptz,
  ADD COLUMN IF NOT EXISTS pinned_by uuid;

-- 3. Create chat_mentions table
CREATE TABLE IF NOT EXISTS public.chat_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  mentioned_user_id uuid NOT NULL,
  room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Enable RLS on chat_mentions
ALTER TABLE public.chat_mentions ENABLE ROW LEVEL SECURITY;

-- mention_select: room members can see mentions
CREATE POLICY "mention_select" ON public.chat_mentions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_room_members crm
      WHERE crm.room_id = chat_mentions.room_id AND crm.user_id = auth.uid()
    )
  );

-- mention_insert: room members can insert mentions
CREATE POLICY "mention_insert" ON public.chat_mentions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_room_members crm
      WHERE crm.room_id = chat_mentions.room_id AND crm.user_id = auth.uid()
    )
  );

-- 5. Allow UPDATE on chat_rooms for pinning (manager+)
CREATE POLICY "room_update_pin" ON public.chat_rooms
  FOR UPDATE TO authenticated
  USING (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role))
  WITH CHECK (is_store_member(auth.uid(), store_id) AND has_role_or_higher(auth.uid(), 'manager'::app_role));
