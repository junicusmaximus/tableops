
CREATE OR REPLACE FUNCTION public.is_store_member(_user_id uuid, _store_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_store_roles WHERE user_id = _user_id AND store_id = _store_id
  ) OR EXISTS (
    SELECT 1 FROM public.user_store_roles WHERE user_id = _user_id AND role IN ('ceo'::app_role, 'owner'::app_role)
  );
$function$;
