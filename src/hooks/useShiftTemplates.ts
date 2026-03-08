import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useToast } from '@/hooks/use-toast';

export interface ShiftTemplate {
  id: string;
  store_id: string;
  name: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  role: string | null;
  created_by: string;
}

export const useShiftTemplates = () => {
  const { data: profile } = useEmployeeProfile();

  return useQuery({
    queryKey: ['shift-templates', profile?.store_id],
    queryFn: async () => {
      if (!profile?.store_id) return [];
      const { data, error } = await supabase
        .from('shift_templates' as any)
        .select('*')
        .eq('store_id', profile.store_id)
        .order('name');
      if (error) throw error;
      return (data ?? []) as unknown as ShiftTemplate[];
    },
    enabled: !!profile?.store_id,
  });
};

export const useCreateShiftTemplate = () => {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: { name: string; start_time: string; end_time: string; break_minutes: number; role?: string | null }) => {
      if (!user || !profile) throw new Error('인증이 필요합니다');
      const { error } = await supabase.from('shift_templates' as any).insert({
        store_id: profile.store_id,
        name: input.name,
        start_time: input.start_time,
        end_time: input.end_time,
        break_minutes: input.break_minutes,
        role: input.role ?? null,
        created_by: user.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-templates'] });
      toast({ title: '템플릿 저장 완료' });
    },
    onError: (e: Error) => {
      toast({ title: '템플릿 저장 실패', description: e.message, variant: 'destructive' });
    },
  });
};

export const useDeleteShiftTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shift_templates' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-templates'] });
      toast({ title: '템플릿 삭제 완료' });
    },
  });
};
