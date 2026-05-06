import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useCurrentRole } from '@/hooks/useUserRole';
import {
  can as canFn,
  canAny as canAnyFn,
  canAll as canAllFn,
  canAccessRoute as canAccessRouteFn,
  canViewMenu as canViewMenuFn,
  checkPermission,
  checkRoute,
  visibleMenuItems,
  DEFAULT_COMPANY_SETTINGS,
  type CompanySettings,
  type Permission,
  type AccessOutcome,
} from '@/lib/permissions';

/**
 * Loads the company_settings row for the current user's organization.
 * Falls back to DEFAULT_COMPANY_SETTINGS while loading or if no row exists.
 */
export const useCompanySettings = (): {
  settings: CompanySettings;
  isLoading: boolean;
} => {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const orgId = profile?.organization_id;

  const { data, isLoading } = useQuery({
    queryKey: ['company-settings', orgId],
    queryFn: async (): Promise<Partial<CompanySettings> | null> => {
      if (!orgId) return null;
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle();
      if (error) throw error;
      return (data as Partial<CompanySettings>) ?? null;
    },
    enabled: !!user && !!orgId,
    staleTime: 60_000,
  });

  const settings = useMemo<CompanySettings>(
    () => ({ ...DEFAULT_COMPANY_SETTINGS, ...(data ?? {}) }),
    [data],
  );

  return { settings, isLoading };
};

export const usePermissions = () => {
  const role = useCurrentRole();
  const { settings, isLoading } = useCompanySettings();

  return useMemo(
    () => ({
      role,
      settings,
      isLoading,
      can: (perm: Permission) => canFn(role, perm, settings),
      canAny: (perms: Permission[]) => canAnyFn(role, perms, settings),
      canAll: (perms: Permission[]) => canAllFn(role, perms, settings),
      canViewMenu: (menuKey: string) => canViewMenuFn(role, menuKey, settings),
      canAccessRoute: (path: string) => canAccessRouteFn(role, path, settings),
      checkPermission: (perm: Permission): AccessOutcome =>
        checkPermission(role, perm, settings),
      checkRoute: (path: string): AccessOutcome => checkRoute(role, path, settings),
      visibleMenu: () => visibleMenuItems(role, settings),
    }),
    [role, settings, isLoading],
  );
};
