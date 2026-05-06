import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ConsentType } from '@/lib/consents';

export interface UserConsentRow {
  id: string;
  user_id: string;
  consent_type: string;
  consent_version: string;
  accepted: boolean;
  accepted_at: string | null;
  withdrawn_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

export const useMyConsents = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-consents', user?.id],
    queryFn: async () => {
      if (!user) return [] as UserConsentRow[];
      const { data, error } = await supabase
        .from('user_consents' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as UserConsentRow[];
    },
    enabled: !!user,
  });
};

export const useUpdateConsent = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      consent_type,
      consent_version,
      accepted,
    }: {
      consent_type: ConsentType;
      consent_version: string;
      accepted: boolean;
    }) => {
      if (!user) throw new Error('로그인이 필요합니다');
      const ua = navigator.userAgent;
      // Find existing row
      const { data: existing } = await supabase
        .from('user_consents' as any)
        .select('id')
        .eq('user_id', user.id)
        .eq('consent_type', consent_type)
        .eq('consent_version', consent_version)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_consents' as any)
          .update({
            accepted,
            accepted_at: accepted ? new Date().toISOString() : null,
            withdrawn_at: accepted ? null : new Date().toISOString(),
            user_agent: ua,
          })
          .eq('id', (existing as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_consents' as any).insert({
          user_id: user.id,
          consent_type,
          consent_version,
          accepted,
          accepted_at: accepted ? new Date().toISOString() : null,
          withdrawn_at: accepted ? null : new Date().toISOString(),
          user_agent: ua,
        });
        if (error) throw error;
      }

      // Mirror access_log_attendance into employee_profiles
      if (consent_type === 'access_log_attendance') {
        await supabase
          .from('employee_profiles')
          .update({
            access_consent_accepted: accepted,
            access_consent_accepted_at: accepted ? new Date().toISOString() : null,
          })
          .eq('user_id', user.id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-consents'] });
      qc.invalidateQueries({ queryKey: ['employee-profile'] });
    },
  });
};
