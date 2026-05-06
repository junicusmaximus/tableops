import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useAccessIntegrations = (storeId?: string) =>
  useQuery({
    queryKey: ['access-integrations', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from('access_integrations')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!storeId,
  });

export const useUpsertIntegration = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      store_id: string;
      provider: string;
      integration_mode: string;
      api_base_url?: string | null;
      api_key?: string | null;
      secret_key?: string | null;
      local_export_path?: string | null;
      sync_frequency?: string;
      is_active?: boolean;
    }) => {
      if (!user) throw new Error('로그인이 필요합니다');
      if (input.id) {
        const { id, ...rest } = input;
        const { data, error } = await supabase
          .from('access_integrations')
          .update(rest)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from('access_integrations')
        .insert({ ...input, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['access-integrations'] }),
  });
};

export const useDeleteIntegration = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('access_integrations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['access-integrations'] }),
  });
};

export const useAccessLogs = (storeId?: string, date?: string) =>
  useQuery({
    queryKey: ['access-logs', storeId, date],
    queryFn: async () => {
      if (!storeId) return [];
      let q = supabase
        .from('access_logs')
        .select('*')
        .eq('store_id', storeId)
        .order('access_datetime', { ascending: false })
        .limit(500);
      if (date) q = q.eq('access_date', date);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!storeId,
  });

export const useImportBatches = (storeId?: string) =>
  useQuery({
    queryKey: ['access-import-batches', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from('access_import_batches')
        .select('*')
        .eq('store_id', storeId)
        .order('imported_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!storeId,
  });

export const useImportAccessLogs = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      store_id: string;
      provider: string;
      file_name: string;
      rows: Array<{
        employee_profile_id: string | null;
        raw_employee_name?: string;
        employee_number?: string;
        access_card_number?: string;
        provider_user_id?: string;
        access_datetime: string;
        access_type?: string;
        device_name?: string;
        door_name?: string;
        raw_payload: Record<string, unknown>;
      }>;
    }) => {
      if (!user) throw new Error('로그인이 필요합니다');
      const matched = input.rows.filter((r) => r.employee_profile_id).length;
      const { data: batch, error: batchErr } = await supabase
        .from('access_import_batches')
        .insert({
          store_id: input.store_id,
          provider: input.provider,
          uploaded_by: user.id,
          file_name: input.file_name,
          row_count: input.rows.length,
          matched_count: matched,
          unmatched_count: input.rows.length - matched,
          status: 'imported',
        })
        .select()
        .single();
      if (batchErr) throw batchErr;

      const payload = input.rows.map((r) => ({
        store_id: input.store_id,
        provider: input.provider,
        employee_profile_id: r.employee_profile_id,
        raw_employee_name: r.raw_employee_name,
        employee_number: r.employee_number,
        access_card_number: r.access_card_number,
        provider_user_id: r.provider_user_id,
        access_datetime: r.access_datetime,
        access_date: r.access_datetime.slice(0, 10),
        access_type: r.access_type,
        device_name: r.device_name,
        door_name: r.door_name,
        import_batch_id: batch.id,
        raw_payload: r.raw_payload,
      }));
      // chunked insert
      for (let i = 0; i < payload.length; i += 500) {
        const chunk = payload.slice(i, i + 500);
        const { error } = await supabase.from('access_logs').insert(chunk);
        if (error) throw error;
      }
      return batch;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['access-logs'] });
      qc.invalidateQueries({ queryKey: ['access-import-batches'] });
    },
  });
};

export const useUpdateAccessLogMatch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, employee_profile_id }: { id: string; employee_profile_id: string | null }) => {
      const { error } = await supabase
        .from('access_logs')
        .update({ employee_profile_id })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['access-logs'] }),
  });
};

export const useUpdateEmployeeAccessMapping = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      employee_number?: string | null;
      access_card_number?: string | null;
      access_provider?: string | null;
      access_provider_user_id?: string | null;
    }) => {
      const { id, ...rest } = input;
      const { error } = await supabase.from('employee_profiles').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['store-employees'] });
      qc.invalidateQueries({ queryKey: ['employee-profile'] });
    },
  });
};

export const useUpdateAccessConsent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, accepted }: { id: string; accepted: boolean }) => {
      const { error } = await supabase
        .from('employee_profiles')
        .update({
          access_consent_accepted: accepted,
          access_consent_accepted_at: accepted ? new Date().toISOString() : null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['store-employees'] });
      qc.invalidateQueries({ queryKey: ['employee-profile'] });
    },
  });
};
