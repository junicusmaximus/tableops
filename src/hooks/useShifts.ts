import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays } from 'date-fns';

export interface Shift {
  id: string;
  store_id: string;
  user_id: string | null;
  shift_date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  role: string | null;
  notes: string | null;
  created_by: string;
  employee_name?: string;
  assignee_type?: string;
  manual_name?: string | null;
  manual_role_label?: string | null;
  manual_phone?: string | null;
}

export const useMonthlyShifts = (month: Date, options?: { userOnly?: boolean }) => {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const start = format(startOfMonth(month), 'yyyy-MM-dd');
  const end = format(endOfMonth(month), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['shifts-monthly', profile?.store_id, start, options?.userOnly ? user?.id : 'all'],
    queryFn: async () => {
      if (!profile?.store_id) return [];
      let query = supabase
        .from('shifts')
        .select('*')
        .eq('store_id', profile.store_id)
        .gte('shift_date', start)
        .lte('shift_date', end)
        .order('start_time');

      if (options?.userOnly && user) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const userIds = [...new Set((data ?? []).filter(s => s.user_id).map((s) => s.user_id!))];
      let nameMap = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: employees } = await supabase
          .from('employee_profiles')
          .select('user_id, full_name')
          .eq('store_id', profile.store_id)
          .in('user_id', userIds);
        nameMap = new Map((employees ?? []).map((e) => [e.user_id, e.full_name]));
      }

      return (data ?? []).map((s: any) => ({
        ...s,
        employee_name: s.assignee_type === 'manual_entry'
          ? (s.manual_name || '직접 입력')
          : (s.user_id ? nameMap.get(s.user_id) ?? '미지정' : '미지정'),
      })) as Shift[];
    },
    enabled: !!profile?.store_id,
  });
};

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
      const userIds = [...new Set((data ?? []).filter(s => s.user_id).map((s) => s.user_id!))];
      if (userIds.length === 0) return (data ?? []).map(s => ({ ...s, employee_name: '미지정' })) as Shift[];
      const { data: employees } = await supabase
        .from('employee_profiles')
        .select('user_id, full_name')
        .eq('store_id', profile.store_id)
        .in('user_id', userIds);
      const nameMap = new Map((employees ?? []).map((e) => [e.user_id, e.full_name]));
      return (data ?? []).map((s) => ({ ...s, employee_name: s.user_id ? nameMap.get(s.user_id) ?? '미지정' : '미지정' })) as Shift[];
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
      user_id?: string | null;
      shift_date: string;
      start_time: string;
      end_time: string;
      break_minutes?: number;
      role?: string | null;
      notes?: string | null;
      assignee_type?: string;
      manual_name?: string | null;
      manual_role_label?: string | null;
      manual_phone?: string | null;
    }) => {
      if (!user || !profile) throw new Error('인증이 필요합니다');
      const { error } = await supabase.from('shifts').insert({
        store_id: profile.store_id,
        user_id: input.user_id || null,
        shift_date: input.shift_date,
        start_time: input.start_time,
        end_time: input.end_time,
        break_minutes: input.break_minutes ?? 0,
        role: input.role ?? null,
        notes: input.notes ?? null,
        created_by: user.id,
        assignee_type: input.assignee_type ?? 'registered_user',
        manual_name: input.manual_name ?? null,
        manual_role_label: input.manual_role_label ?? null,
        manual_phone: input.manual_phone ?? null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shifts-monthly'] });
      toast({ title: '스케줄 등록 완료' });
    },
    onError: (e: Error) => {
      toast({ title: '등록 실패', description: e.message, variant: 'destructive' });
    },
  });
};

export const useUpdateShift = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...input }: {
      id: string;
      [key: string]: any;
    }) => {
      const { error } = await supabase.from('shifts').update(input as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shifts-monthly'] });
      toast({ title: '스케줄 수정 완료' });
    },
    onError: (e: Error) => {
      toast({ title: '수정 실패', description: e.message, variant: 'destructive' });
    },
  });
};

export const useDeleteConflictingShifts = () => {
  const { data: profile } = useEmployeeProfile();
  return async (entries: Array<{ user_id: string; shift_date: string }>) => {
    if (!profile?.store_id || entries.length === 0) return;
    // Group by date for efficient deletion
    const dateUserMap = new Map<string, string[]>();
    for (const e of entries) {
      const list = dateUserMap.get(e.shift_date) || [];
      list.push(e.user_id);
      dateUserMap.set(e.shift_date, list);
    }
    for (const [date, userIds] of dateUserMap) {
      await supabase
        .from('shifts')
        .delete()
        .eq('store_id', profile.store_id)
        .eq('shift_date', date)
        .in('user_id', userIds);
    }
  };
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
      queryClient.invalidateQueries({ queryKey: ['shifts-monthly'] });
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
      const targetStart = startOfWeek(targetWeekStart, { weekStartsOn: 1 });
      const targetEnd = endOfWeek(targetWeekStart, { weekStartsOn: 1 });
      const prevStart = format(addDays(targetStart, -7), 'yyyy-MM-dd');
      const prevEnd = format(addDays(targetEnd, -7), 'yyyy-MM-dd');
      const targetStartStr = format(targetStart, 'yyyy-MM-dd');
      const targetEndStr = format(targetEnd, 'yyyy-MM-dd');

      const { data: prevShifts, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('store_id', profile.store_id)
        .gte('shift_date', prevStart)
        .lte('shift_date', prevEnd);
      if (error) throw error;
      if (!prevShifts?.length) throw new Error('이전 주 스케줄이 없습니다');

      // Delete existing shifts in the target week to prevent duplicates
      const { error: deleteErr } = await supabase
        .from('shifts')
        .delete()
        .eq('store_id', profile.store_id)
        .gte('shift_date', targetStartStr)
        .lte('shift_date', targetEndStr);
      if (deleteErr) throw deleteErr;

      const newShifts = prevShifts.map((s: any) => {
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
          assignee_type: s.assignee_type ?? 'registered_user',
          manual_name: s.manual_name,
          manual_role_label: s.manual_role_label,
          manual_phone: s.manual_phone,
        };
      });

      const { error: insertErr } = await supabase.from('shifts').insert(newShifts as any);
      if (insertErr) throw insertErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shifts-monthly'] });
      toast({ title: '이전 주 스케줄이 복사되었습니다' });
    },
    onError: (e: Error) => {
      toast({ title: '복사 실패', description: e.message, variant: 'destructive' });
    },
  });
};
