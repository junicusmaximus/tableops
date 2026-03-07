import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useToast } from '@/hooks/use-toast';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';

export interface Shift {
  id: string;
  store_id: string;
  user_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  role: string | null;
  notes: string | null;
  created_by: string;
  employee_name?: string;
}

export const useWeeklyShifts = (weekStart: Date) => {
  const { data: profile } = useEmployeeProfile();
  const start = format(startOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const end = format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['shifts', profile?.store_id, start],
    queryFn: async () => {
      if (!profile?.store_id) return [];
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('store_id', profile.store_id)
        .gte('shift_date', start)
        .lte('shift_date', end)
        .order('start_time');
      if (error) throw error;

      // Get employee names
      const userIds = [...new Set((data ?? []).map((s) => s.user_id))];
      if (userIds.length === 0) return [];
      const { data: employees } = await supabase
        .from('employee_profiles')
        .select('user_id, full_name')
        .eq('store_id', profile.store_id)
        .in('user_id', userIds);
      const nameMap = new Map((employees ?? []).map((e) => [e.user_id, e.full_name]));
      return (data ?? []).map((s) => ({ ...s, employee_name: nameMap.get(s.user_id) ?? '미지정' })) as Shift[];
    },
    enabled: !!profile?.store_id,
  });
};

export const useCreateShift = () => {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      user_id: string;
      shift_date: string;
      start_time: string;
      end_time: string;
      break_minutes?: number;
      role?: string;
      notes?: string;
    }) => {
      if (!user || !profile) throw new Error('인증이 필요합니다');
      const { error } = await supabase.from('shifts').insert({
        store_id: profile.store_id,
        user_id: input.user_id,
        shift_date: input.shift_date,
        start_time: input.start_time,
        end_time: input.end_time,
        break_minutes: input.break_minutes ?? 0,
        role: input.role ?? null,
        notes: input.notes ?? null,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast({ title: '스케줄 등록 완료' });
    },
    onError: (e: Error) => {
      toast({ title: '등록 실패', description: e.message, variant: 'destructive' });
    },
  });
};

export const useDeleteShift = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shifts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast({ title: '스케줄 삭제 완료' });
    },
  });
};

export const useCopyPreviousWeek = () => {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (targetWeekStart: Date) => {
      if (!user || !profile) throw new Error('인증이 필요합니다');
      const prevStart = format(addDays(startOfWeek(targetWeekStart, { weekStartsOn: 1 }), -7), 'yyyy-MM-dd');
      const prevEnd = format(addDays(endOfWeek(targetWeekStart, { weekStartsOn: 1 }), -7), 'yyyy-MM-dd');
      const targetStart = startOfWeek(targetWeekStart, { weekStartsOn: 1 });

      const { data: prevShifts, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('store_id', profile.store_id)
        .gte('shift_date', prevStart)
        .lte('shift_date', prevEnd);
      if (error) throw error;
      if (!prevShifts?.length) throw new Error('이전 주 스케줄이 없습니다');

      const newShifts = prevShifts.map((s) => {
        const dayOfWeek = new Date(s.shift_date).getDay();
        const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const newDate = format(addDays(targetStart, adjustedDay), 'yyyy-MM-dd');
        return {
          store_id: s.store_id,
          user_id: s.user_id,
          shift_date: newDate,
          start_time: s.start_time,
          end_time: s.end_time,
          break_minutes: s.break_minutes,
          role: s.role,
          notes: s.notes,
          created_by: user.id,
        };
      });

      const { error: insertErr } = await supabase.from('shifts').insert(newShifts);
      if (insertErr) throw insertErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast({ title: '이전 주 스케줄이 복사되었습니다' });
    },
    onError: (e: Error) => {
      toast({ title: '복사 실패', description: e.message, variant: 'destructive' });
    },
  });
};
