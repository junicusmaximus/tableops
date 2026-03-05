
-- Chat rooms table
CREATE TABLE public.chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'group', -- 'group', 'announcement'
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Chat room members
CREATE TABLE public.chat_room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Chat messages
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  message_type text NOT NULL DEFAULT 'text', -- 'text', 'system'
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Read receipts (last read timestamp per user per room)
CREATE TABLE public.chat_read_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Enable RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_read_receipts ENABLE ROW LEVEL SECURITY;

-- RLS: chat_rooms - members can see rooms they belong to
CREATE POLICY "room_select" ON public.chat_rooms FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.chat_room_members crm WHERE crm.room_id = id AND crm.user_id = auth.uid())
    OR is_store_member(auth.uid(), store_id)
  );

CREATE POLICY "room_insert" ON public.chat_rooms FOR INSERT TO authenticated
  WITH CHECK (
    is_store_member(auth.uid(), store_id) AND created_by = auth.uid()
  );

-- RLS: chat_room_members
CREATE POLICY "member_select" ON public.chat_room_members FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.chat_room_members m2 WHERE m2.room_id = room_id AND m2.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.chat_rooms cr WHERE cr.id = room_id AND is_store_member(auth.uid(), cr.store_id))
  );

CREATE POLICY "member_insert" ON public.chat_room_members FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.chat_rooms cr WHERE cr.id = room_id AND is_store_member(auth.uid(), cr.store_id))
  );

-- RLS: chat_messages - room members can read, sender can insert
CREATE POLICY "msg_select" ON public.chat_messages FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.chat_room_members crm WHERE crm.room_id = room_id AND crm.user_id = auth.uid())
  );

CREATE POLICY "msg_insert" ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- RLS: chat_read_receipts
CREATE POLICY "receipt_select" ON public.chat_read_receipts FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "receipt_upsert" ON public.chat_read_receipts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "receipt_update" ON public.chat_read_receipts FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Create index for performance
CREATE INDEX idx_chat_messages_room_id ON public.chat_messages(room_id, created_at DESC);
CREATE INDEX idx_chat_room_members_user_id ON public.chat_room_members(user_id);
CREATE INDEX idx_chat_read_receipts_user_room ON public.chat_read_receipts(user_id, room_id);
