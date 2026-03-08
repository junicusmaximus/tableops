import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';

export type AppRole = 'owner' | 'manager' | 'kitchen_staff' | 'hall_staff' | 'ceo' | 'boss' | 'full_time' | 'part_time';

export const ROLE_LABELS: Record<AppRole, string> = {
  ceo: '대표',
  boss: '사장님',
  owner: '대표',
  manager: '매니저',
  kitchen_staff: '주방 직원',
  hall_staff: '홀 직원',
  full_time: '정직원',
  part_time: '파트타이머',
};

// Ordered by permission level (highest first)
const MANAGER_ROLES: AppRole[] = ['ceo', 'owner', 'boss', 'manager'];
const STAFF_ROLES: AppRole[] = ['full_time', 'part_time', 'kitchen_staff', 'hall_staff'];

export const SIGNUP_ROLES: { value: AppRole; label: string }[] = [
  { value: 'ceo', label: '대표' },
  { value: 'boss', label: '사장님' },
  { value: 'manager', label: '매니저' },
  { value: 'full_time', label: '정직원' },
  { value: 'part_time', label: '파트타이머' },
];

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
  return MANAGER_ROLES.includes(role as AppRole);
};

export const useIsStaff = (): boolean => {
  const role = useCurrentRole();
  return STAFF_ROLES.includes(role as AppRole);
};

export const getRoleLabel = (role: string): string => {
  return ROLE_LABELS[role as AppRole] ?? role;
};
