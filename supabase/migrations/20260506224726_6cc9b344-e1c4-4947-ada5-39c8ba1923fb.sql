
REVOKE EXECUTE ON FUNCTION public.ensure_default_chat_rooms(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.tg_store_create_default_rooms() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.tg_usr_join_default_rooms() FROM anon, authenticated, public;
