import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';

export interface CompanySettings {
  id: string;
  organization_id: string;
  allow_manager_sales_access: boolean;
  allow_manager_sales_detail_access: boolean;
  allow_manager_branch_comparison: boolean;
  updated_by: string | null;
  updated_at: string;
}

export const useCompanySettings = () => {
  const { data: profile } = useEmployeeProfile();
  return useQuery({
    queryKey: ['company-settings', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return null;
      const { data, error } = await supabase
        .from('company_settings' as any)
        .select('*')
        .eq('organization_id', profile.organization_id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as CompanySettings | null;
    },
    enabled: !!profile?.organization_id,
  });
};

export const useUpsertCompanySettings = () => {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (patch: Partial<Omit<CompanySettings, 'id' | 'organization_id' | 'updated_by' | 'updated_at'>>) => {
      if (!user || !profile?.organization_id) throw new Error('인증 정보가 없습니다.');
      const { data: existing } = await supabase
        .from('company_settings' as any)
        .select('id')
        .eq('organization_id', profile.organization_id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('company_settings' as any)
          .update({ ...patch, updated_by: user.id })
          .eq('id', (existing as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('company_settings' as any).insert({
          organization_id: profile.organization_id,
          updated_by: user.id,
          ...patch,
        });
        if (error) throw error;
      }

      // Audit log
      await supabase.from('sales_audit_logs' as any).insert({
        user_id: user.id,
        action_type: 'manager_sales_access_changed',
        organization_id: profile.organization_id,
        metadata: patch as any,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company-settings'] }),
  });
};
