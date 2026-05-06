import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useCurrentRole, getRoleLabel } from '@/hooks/useUserRole';
import type { DocumentSchema } from '@/lib/documentTypes';

export const useDocumentTemplates = () => {
  const { data: profile } = useEmployeeProfile();
  return useQuery({
    queryKey: ['doc-templates', profile?.store_id],
    queryFn: async () => {
      if (!profile?.store_id) return [];
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('store_id', profile.store_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!profile?.store_id,
  });
};

export const useDocumentTemplate = (id: string | undefined) => {
  return useQuery({
    queryKey: ['doc-template', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useSaveTemplate = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  return useMutation({
    mutationFn: async (input: { id?: string; title: string; category: string; description?: string; schema: DocumentSchema; status?: string }) => {
      if (!user || !profile?.store_id) throw new Error('인증 필요');
      if (input.id) {
        const { data, error } = await supabase
          .from('document_templates')
          .update({
            title: input.title,
            category: input.category,
            description: input.description ?? null,
            template_schema: input.schema as any,
            status: input.status ?? 'active',
          })
          .eq('id', input.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('document_templates')
          .insert({
            store_id: profile.store_id,
            title: input.title,
            category: input.category,
            description: input.description ?? null,
            template_schema: input.schema as any,
            status: input.status ?? 'active',
            created_by: user.id,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doc-templates'] }),
  });
};

export const useDeleteTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('document_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doc-templates'] }),
  });
};

// Document Requests
export const useReceivedDocuments = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['doc-requests-received', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('document_requests')
        .select('*')
        .eq('recipient_user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
};

export const useSentDocuments = () => {
  const { data: profile } = useEmployeeProfile();
  return useQuery({
    queryKey: ['doc-requests-sent', profile?.store_id],
    queryFn: async () => {
      if (!profile?.store_id) return [];
      const { data, error } = await supabase
        .from('document_requests')
        .select('*')
        .eq('store_id', profile.store_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!profile?.store_id,
  });
};

export const useDocumentRequest = (id: string | undefined) => {
  return useQuery({
    queryKey: ['doc-request', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('document_requests')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useFieldValues = (requestId: string | undefined) => {
  return useQuery({
    queryKey: ['doc-field-values', requestId],
    queryFn: async () => {
      if (!requestId) return [];
      const { data, error } = await supabase
        .from('document_field_values')
        .select('*')
        .eq('request_id', requestId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!requestId,
  });
};

export const useSignature = (requestId: string | undefined) => {
  return useQuery({
    queryKey: ['doc-signature', requestId],
    queryFn: async () => {
      if (!requestId) return null;
      const { data, error } = await supabase
        .from('document_signatures')
        .select('*')
        .eq('request_id', requestId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!requestId,
  });
};

export const useFinalDocument = (requestId: string | undefined) => {
  return useQuery({
    queryKey: ['doc-final', requestId],
    queryFn: async () => {
      if (!requestId) return null;
      const { data, error } = await supabase
        .from('final_documents')
        .select('*')
        .eq('request_id', requestId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!requestId,
  });
};

export const useAuditLogs = (requestId: string | undefined) => {
  return useQuery({
    queryKey: ['doc-audit', requestId],
    queryFn: async () => {
      if (!requestId) return [];
      const { data, error } = await supabase
        .from('document_audit_logs')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!requestId,
  });
};

export const useAuditLogger = () => {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const role = useCurrentRole();
  return async (requestId: string, eventType: string, metadata: Record<string, unknown> = {}) => {
    if (!user) return;
    await supabase.from('document_audit_logs').insert({
      request_id: requestId,
      event_type: eventType,
      actor_user_id: user.id,
      actor_name: profile?.full_name ?? user.email ?? '알수없음',
      actor_role: role ? getRoleLabel(role) : null,
      user_agent: navigator.userAgent,
      metadata: metadata as any,
    });
  };
};

export const useSendDocument = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const log = useAuditLogger();
  return useMutation({
    mutationFn: async (input: {
      template_id: string;
      title: string;
      category: string;
      schema: DocumentSchema;
      recipient_user_id: string;
      recipient_name: string;
      due_date?: string | null;
    }) => {
      if (!user || !profile?.store_id) throw new Error('인증 필요');
      const { data, error } = await supabase
        .from('document_requests')
        .insert({
          template_id: input.template_id,
          store_id: profile.store_id,
          title: input.title,
          category: input.category,
          document_schema: input.schema as any,
          sender_user_id: user.id,
          recipient_user_id: input.recipient_user_id,
          recipient_name: input.recipient_name,
          due_date: input.due_date ?? null,
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;

      await log(data.id, 'document_created', { recipient: input.recipient_name });
      await log(data.id, 'sent', { recipient: input.recipient_name });

      // notify recipient
      await supabase.from('notifications').insert({
        user_id: input.recipient_user_id,
        type: 'document',
        title: '서명이 필요한 문서가 도착했습니다',
        message: `"${input.title}" 문서를 확인하고 서명해주세요.`,
        related_entity_type: 'document_request',
        related_entity_id: data.id,
        created_by: user.id,
      });

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doc-requests-sent'] });
      qc.invalidateQueries({ queryKey: ['doc-requests-received'] });
    },
  });
};

export const useCancelDocument = () => {
  const qc = useQueryClient();
  const log = useAuditLogger();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('document_requests')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      await log(id, 'cancelled');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doc-requests-sent'] });
      qc.invalidateQueries({ queryKey: ['doc-request'] });
    },
  });
};

export const useMarkViewed = () => {
  const log = useAuditLogger();
  return async (id: string, currentStatus: string) => {
    if (currentStatus !== 'sent') return;
    await supabase
      .from('document_requests')
      .update({ status: 'viewed', viewed_at: new Date().toISOString() })
      .eq('id', id);
    await log(id, 'viewed');
  };
};
