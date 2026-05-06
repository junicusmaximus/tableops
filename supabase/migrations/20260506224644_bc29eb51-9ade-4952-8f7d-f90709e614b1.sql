
-- 1. chat_messages 확장
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS parent_message_id uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS chat_messages_updated_at ON public.chat_messages;
CREATE TRIGGER chat_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. chat_rooms 확장
ALTER TABLE public.chat_rooms
  ADD COLUMN IF NOT EXISTS branch_id uuid,
  ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_announcement boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS description text;

-- 3. chat_room_members 확장
ALTER TABLE public.chat_room_members
  ADD COLUMN IF NOT EXISTS muted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_read_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS role_in_room text NOT NULL DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS notification_enabled boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS chat_room_members_unique
  ON public.chat_room_members(room_id, user_id);

-- 4. chat_reactions
CREATE TABLE IF NOT EXISTS public.chat_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, reaction_type)
);
ALTER TABLE public.chat_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY reaction_select ON public.chat_reactions FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.chat_messages m
  JOIN public.chat_room_members crm ON crm.room_id = m.room_id
  WHERE m.id = chat_reactions.message_id AND crm.user_id = auth.uid()
));
CREATE POLICY reaction_insert ON public.chat_reactions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND EXISTS (
  SELECT 1 FROM public.chat_messages m
  JOIN public.chat_room_members crm ON crm.room_id = m.room_id
  WHERE m.id = chat_reactions.message_id AND crm.user_id = auth.uid()
));
CREATE POLICY reaction_delete ON public.chat_reactions FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- 5. chat_confirmations
CREATE TABLE IF NOT EXISTS public.chat_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);
ALTER TABLE public.chat_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY conf_select ON public.chat_confirmations FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.chat_messages m
  JOIN public.chat_room_members crm ON crm.room_id = m.room_id
  WHERE m.id = chat_confirmations.message_id AND crm.user_id = auth.uid()
));
CREATE POLICY conf_insert ON public.chat_confirmations FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND EXISTS (
  SELECT 1 FROM public.chat_messages m
  JOIN public.chat_room_members crm ON crm.room_id = m.room_id
  WHERE m.id = chat_confirmations.message_id AND crm.user_id = auth.uid()
));
CREATE POLICY conf_delete ON public.chat_confirmations FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- 6. chat_pinned_messages (multi-pin)
CREATE TABLE IF NOT EXISTS public.chat_pinned_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  pinned_by uuid NOT NULL,
  pinned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, message_id)
);
ALTER TABLE public.chat_pinned_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY pin_select ON public.chat_pinned_messages FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.chat_room_members crm
  WHERE crm.room_id = chat_pinned_messages.room_id AND crm.user_id = auth.uid()
));
CREATE POLICY pin_insert ON public.chat_pinned_messages FOR INSERT TO authenticated
WITH CHECK (
  pinned_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.chat_rooms cr
    WHERE cr.id = chat_pinned_messages.room_id
      AND public.is_store_member(auth.uid(), cr.store_id)
      AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)
  )
);
CREATE POLICY pin_delete ON public.chat_pinned_messages FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.chat_rooms cr
  WHERE cr.id = chat_pinned_messages.room_id
    AND public.is_store_member(auth.uid(), cr.store_id)
    AND public.has_role_or_higher(auth.uid(), 'manager'::app_role)
));

-- 7. Default rooms creator
CREATE OR REPLACE FUNCTION public.ensure_default_chat_rooms(_store_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _brand uuid;
  _system_user uuid;
  _room_id uuid;
  _spec record;
BEGIN
  IF _store_id IS NULL THEN RETURN; END IF;
  SELECT brand_id INTO _brand FROM public.stores WHERE id = _store_id;

  -- Use any owner/ceo as creator, else any store member
  SELECT user_id INTO _system_user
    FROM public.user_store_roles
    WHERE store_id = _store_id
    ORDER BY CASE role
      WHEN 'ceo' THEN 1 WHEN 'owner' THEN 2 WHEN 'boss' THEN 3
      WHEN 'manager' THEN 4 ELSE 5 END
    LIMIT 1;

  IF _system_user IS NULL THEN RETURN; END IF;

  FOR _spec IN
    SELECT * FROM (VALUES
      ('매장 전체 채팅방',  'channel',      false),
      ('홀팀',              'group',        false),
      ('주방팀',            'group',        false),
      ('매니저 채팅방',     'group',        false),
      ('전체 공지',         'announcement', true)
    ) AS t(name, type, is_ann)
  LOOP
    SELECT id INTO _room_id FROM public.chat_rooms
      WHERE store_id = _store_id AND name = _spec.name AND is_default = true
      LIMIT 1;
    IF _room_id IS NULL THEN
      INSERT INTO public.chat_rooms (store_id, branch_id, name, type, created_by, is_default, is_announcement)
        VALUES (_store_id, _brand, _spec.name, _spec.type, _system_user, true, _spec.is_ann)
        RETURNING id INTO _room_id;
    END IF;

    -- Auto-join eligible members
    INSERT INTO public.chat_room_members (room_id, user_id, role_in_room)
    SELECT _room_id, usr.user_id,
      CASE WHEN usr.role IN ('ceo','owner','boss','manager') THEN 'admin' ELSE 'member' END
    FROM public.user_store_roles usr
    WHERE usr.store_id = _store_id
      AND CASE _spec.name
        WHEN '홀팀'          THEN usr.role IN ('hall_staff','full_time','part_time','manager','boss','owner','ceo')
        WHEN '주방팀'        THEN usr.role IN ('kitchen_staff','full_time','part_time','manager','boss','owner','ceo')
        WHEN '매니저 채팅방' THEN usr.role IN ('manager','boss','owner','ceo')
        ELSE true
      END
    ON CONFLICT (room_id, user_id) DO NOTHING;
  END LOOP;
END;
$$;

-- 8. Auto-create on store insert
CREATE OR REPLACE FUNCTION public.tg_store_create_default_rooms()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.ensure_default_chat_rooms(NEW.id);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS store_default_rooms ON public.stores;
CREATE TRIGGER store_default_rooms
  AFTER INSERT ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.tg_store_create_default_rooms();

-- 9. Auto-join on user_store_roles insert
CREATE OR REPLACE FUNCTION public.tg_usr_join_default_rooms()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.ensure_default_chat_rooms(NEW.store_id);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS usr_join_default_rooms ON public.user_store_roles;
CREATE TRIGGER usr_join_default_rooms
  AFTER INSERT ON public.user_store_roles
  FOR EACH ROW EXECUTE FUNCTION public.tg_usr_join_default_rooms();

-- 10. Realtime publication
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_room_members;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_read_receipts;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_reactions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_confirmations;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_pinned_messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.chat_rooms REPLICA IDENTITY FULL;
ALTER TABLE public.chat_room_members REPLICA IDENTITY FULL;
ALTER TABLE public.chat_read_receipts REPLICA IDENTITY FULL;
ALTER TABLE public.chat_reactions REPLICA IDENTITY FULL;
ALTER TABLE public.chat_confirmations REPLICA IDENTITY FULL;
ALTER TABLE public.chat_pinned_messages REPLICA IDENTITY FULL;
