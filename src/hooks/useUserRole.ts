import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';

export type AppRole = 'owner' | 'manager' | 'kitchen_staff' | 'hall_staff';

export const ROLE_LABELS: Record<AppRole, string> = {
  owner: '대표',
  manager: '매니저',
  kitchen_staff: '주방 직원',
  hall_staff: '홀 직원',
};

export const useUserRole = () => {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();

  return useQuery({
    queryKey: ['user-role', user?.id, profile?.store_id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_store_roles')
        .select('role, store_id')
        .eq('user_id', user.id)
        .limit(10);
      if (error) throw error;
      return data as Array<{ role: AppRole; store_id: string }>;
    },
    enabled: !!user,
  });
};

export const useCurrentRole = (): AppRole | null => {
  const { data: roles } = useUserRole();
  const { data: profile } = useEmployeeProfile();
  if (!roles || roles.length === 0) return null;
  const storeRole = roles.find((r) => r.store_id === profile?.store_id);
  return (storeRole?.role ?? roles[0]?.role ?? null) as AppRole | null;
};

export const useIsManager = (): boolean => {
  const role = useCurrentRole();
  return role === 'owner' || role === 'manager';
};
