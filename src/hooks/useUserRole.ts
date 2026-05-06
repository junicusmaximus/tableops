import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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

const ROLE_RANK: Record<AppRole, number> = {
  ceo: 1,
  owner: 2,
  boss: 3,
  manager: 4,
  full_time: 5,
  part_time: 6,
  kitchen_staff: 7,
  hall_staff: 8,
};

const MANAGER_ROLES: AppRole[] = ['ceo', 'owner', 'boss', 'manager'];

export const SIGNUP_ROLES: { value: AppRole; label: string }[] = [
  { value: 'ceo', label: '대표' },
  { value: 'boss', label: '사장님' },
  { value: 'manager', label: '매니저' },
  { value: 'full_time', label: '정직원' },
  { value: 'part_time', label: '파트타이머' },
];

// ===== Dev-only role override (client-side preview only) =====
const ROLE_OVERRIDE_KEY = 'tableops:role-override';
const ROLE_OVERRIDE_EVENT = 'tableops:role-override-changed';

export const getRoleOverride = (): AppRole | null => {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(ROLE_OVERRIDE_KEY);
  return v && Object.keys(ROLE_LABELS).includes(v) ? (v as AppRole) : null;
};

export const setRoleOverride = (role: AppRole | null) => {
  if (typeof window === 'undefined') return;
  if (role) localStorage.setItem(ROLE_OVERRIDE_KEY, role);
  else localStorage.removeItem(ROLE_OVERRIDE_KEY);
  window.dispatchEvent(new Event(ROLE_OVERRIDE_EVENT));
};

export const useRoleOverride = (): AppRole | null => {
  const [override, setOverride] = useState<AppRole | null>(getRoleOverride);
  useEffect(() => {
    const handler = () => setOverride(getRoleOverride());
    window.addEventListener(ROLE_OVERRIDE_EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(ROLE_OVERRIDE_EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);
  return override;
};

export const useUserRole = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-role', user?.id],
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
  const { user } = useAuth();
  const { data: roles, isLoading: rolesLoading } = useUserRole();
  const { data: profile } = useEmployeeProfile();
  const override = useRoleOverride();

  // Dev-only override takes precedence
  if (override) return override;

  // If roles loaded and found, use them
  if (roles && roles.length > 0) {
    const storeRole = roles.find((r) => r.store_id === profile?.store_id);
    return (storeRole?.role ?? roles[0]?.role ?? null) as AppRole | null;
  }

  // Fallback: check user metadata (set during signup)
  if (!rolesLoading && user) {
    const metaRole = user.user_metadata?.role as AppRole | undefined;
    if (metaRole && Object.keys(ROLE_LABELS).includes(metaRole)) {
      return metaRole;
    }
  }

  return null;
};

export const useIsManager = (): boolean => {
  const role = useCurrentRole();
  if (!role) return false;
  return MANAGER_ROLES.includes(role);
};

export const useIsStaff = (): boolean => {
  const role = useCurrentRole();
  if (!role) return false;
  return !MANAGER_ROLES.includes(role);
};

export const isManagerRole = (role: string | null | undefined): boolean => {
  if (!role) return false;
  return MANAGER_ROLES.includes(role as AppRole);
};

export const getRoleLabel = (role: string): string => {
  return ROLE_LABELS[role as AppRole] ?? role;
};

export const getRoleRank = (role: string): number => {
  return ROLE_RANK[role as AppRole] ?? 99;
};
