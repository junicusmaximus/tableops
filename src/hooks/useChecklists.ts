import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export interface ChecklistTemplate {
  id: string;
  store_id: string;
  checklist_type: 'opening' | 'closing';
  title: string;
  description: string | null;
  assigned_role: string | null;
  requires_photo: boolean;
  sort_order: number;
  is_active: boolean;
  created_by: string;
}

export interface ChecklistRun {
  id: string;
  template_id: string;
  store_id: string;
  business_date: string;
  assigned_user_id: string | null;
  completed_by: string | null;
  completed_at: string | null;
  status: 'pending' | 'completed' | 'skipped';
  note: string | null;
  photo_url: string | null;
  template?: ChecklistTemplate;
}

export const useChecklistTemplates = (type?: 'opening' | 'closing') => {
  const { data: profile } = useEmployeeProfile();
  return useQuery({
    queryKey: ['checklist-templates', profile?.store_id, type],
    queryFn: async () => {
      if (!profile?.store_id) return [];
      let q = supabase
        .from('checklist_templates')
        .select('*')
        .eq('store_id', profile.store_id)
        .eq('is_active', true)
        .order('sort_order');
      if (type) q = q.eq('checklist_type', type);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ChecklistTemplate[];
    },
    enabled: !!profile?.store_id,
  });
};

export const useTodayChecklistRuns = (type?: 'opening' | 'closing') => {
  const { data: profile } = useEmployeeProfile();
  const today = format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['checklist-runs', profile?.store_id, today, type],
    queryFn: async () => {
      if (!profile?.store_id) return [];
      let q = supabase
        .from('checklist_runs')
        .select('*, checklist_templates(*)')
        .eq('store_id', profile.store_id)
        .eq('business_date', today);
      const { data, error } = await q;
      if (error) throw error;
      let runs = (data ?? []).map((r: any) => ({
        ...r,
        template: r.checklist_templates,
      }));
      if (type) runs = runs.filter((r: any) => r.template?.checklist_type === type);
      return runs as ChecklistRun[];
    },
    enabled: !!profile?.store_id,
  });
};

export const useCreateTemplate = () => {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      checklist_type: 'opening' | 'closing';
      title: string;
      description?: string;
      assigned_role?: string;
      requires_photo?: boolean;
      sort_order?: number;
    }) => {
      if (!user || !profile) throw new Error('인증이 필요합니다');
      const { error } = await supabase.from('checklist_templates').insert({
        store_id: profile.store_id,
        checklist_type: input.checklist_type,
        title: input.title,
        description: input.description ?? null,
        assigned_role: input.assigned_role ?? null,
        requires_photo: input.requires_photo ?? false,
        sort_order: input.sort_order ?? 0,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
      toast({ title: '체크리스트 항목 추가 완료' });
    },
    onError: (e: Error) => {
      toast({ title: '추가 실패', description: e.message, variant: 'destructive' });
    },
  });
};

export const useInitTodayRuns = () => {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user || !profile) throw new Error('인증이 필요합니다');
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Get active templates
      const { data: templates } = await supabase
        .from('checklist_templates')
        .select('id')
        .eq('store_id', profile.store_id)
        .eq('is_active', true);
      if (!templates?.length) return;

      // Check existing runs
      const { data: existing } = await supabase
        .from('checklist_runs')
        .select('template_id')
        .eq('store_id', profile.store_id)
        .eq('business_date', today);
      const existingIds = new Set((existing ?? []).map((e) => e.template_id));
      
      const newRuns = templates
        .filter((t) => !existingIds.has(t.id))
        .map((t) => ({
          template_id: t.id,
          store_id: profile.store_id,
          business_date: today,
          status: 'pending' as const,
        }));
      if (newRuns.length === 0) return;
      const { error } = await supabase.from('checklist_runs').insert(newRuns);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-runs'] });
    },
  });
};

export const useCompleteChecklistRun = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ runId, note }: { runId: string; note?: string }) => {
      if (!user) throw new Error('인증이 필요합니다');
      const { error } = await supabase
        .from('checklist_runs')
        .update({
          status: 'completed',
          completed_by: user.id,
          completed_at: new Date().toISOString(),
          note: note ?? null,
        })
        .eq('id', runId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-runs'] });
      toast({ title: '체크리스트 완료' });
    },
  });
};
