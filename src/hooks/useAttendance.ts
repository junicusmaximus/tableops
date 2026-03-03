import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

export type AttendanceLog = Tables<'attendance_logs'>;

export const useAttendanceLogs = (storeId: string | undefined, date?: string) => {
  const targetDate = date || new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['attendance-logs', storeId, targetDate],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from('attendance_logs')
        .select('*, employee_profiles(full_name, position)')
        .eq('store_id', storeId)
        .eq('date', targetDate)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!storeId,
  });
};

export const useMyTodayAttendance = (storeId: string | undefined) => {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['my-attendance', user?.id, storeId, today],
    queryFn: async () => {
      if (!user || !storeId) return null;
      const { data, error } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('store_id', storeId)
        .eq('date', today)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!storeId,
  });
};

export const useCheckIn = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ employeeProfileId, storeId }: { employeeProfileId: string; storeId: string }) => {
      if (!user) throw new Error('로그인이 필요합니다');
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('attendance_logs')
        .insert({
          employee_profile_id: employeeProfileId,
          store_id: storeId,
          user_id: user.id,
          check_in_at: now,
          status: 'checked_in',
          date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-logs'] });
      queryClient.invalidateQueries({ queryKey: ['my-attendance'] });
      toast({ title: '출근 완료', description: '출근이 기록되었습니다.' });
    },
    onError: (error: Error) => {
      toast({ title: '출근 실패', description: error.message, variant: 'destructive' });
    },
  });
};

export const useCheckOut = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (attendanceLogId: string) => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('attendance_logs')
        .update({
          check_out_at: now,
          status: 'checked_out',
        })
        .eq('id', attendanceLogId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-logs'] });
      queryClient.invalidateQueries({ queryKey: ['my-attendance'] });
      toast({ title: '퇴근 완료', description: '퇴근이 기록되었습니다.' });
    },
    onError: (error: Error) => {
      toast({ title: '퇴근 실패', description: error.message, variant: 'destructive' });
    },
  });
};

export const useStartBreak = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (attendanceLogId: string) => {
      const { data, error } = await supabase
        .from('break_logs')
        .insert({ attendance_log_id: attendanceLogId })
        .select()
        .single();
      if (error) throw error;
      // Update attendance status
      await supabase
        .from('attendance_logs')
        .update({ status: 'on_break' })
        .eq('id', attendanceLogId);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-logs'] });
      queryClient.invalidateQueries({ queryKey: ['my-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['break-logs'] });
      toast({ title: '휴식 시작', description: '휴식이 시작되었습니다.' });
    },
    onError: (error: Error) => {
      toast({ title: '휴식 시작 실패', description: error.message, variant: 'destructive' });
    },
  });
};

export const useEndBreak = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (breakLogId: string) => {
      const now = new Date();
      const { data: breakLog, error: fetchError } = await supabase
        .from('break_logs')
        .select('*, attendance_logs(id)')
        .eq('id', breakLogId)
        .single();
      if (fetchError) throw fetchError;

      const startAt = new Date(breakLog.start_at);
      const durationMinutes = (now.getTime() - startAt.getTime()) / 60000;

      const { error } = await supabase
        .from('break_logs')
        .update({ end_at: now.toISOString(), duration_minutes: Math.round(durationMinutes * 10) / 10 })
        .eq('id', breakLogId);
      if (error) throw error;

      // Restore attendance status
      await supabase
        .from('attendance_logs')
        .update({ status: 'checked_in' })
        .eq('id', breakLog.attendance_log_id);

      return breakLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-logs'] });
      queryClient.invalidateQueries({ queryKey: ['my-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['break-logs'] });
      toast({ title: '휴식 종료', description: '근무를 재개합니다.' });
    },
    onError: (error: Error) => {
      toast({ title: '휴식 종료 실패', description: error.message, variant: 'destructive' });
    },
  });
};

export const useActiveBreak = (attendanceLogId: string | undefined) => {
  return useQuery({
    queryKey: ['break-logs', attendanceLogId],
    queryFn: async () => {
      if (!attendanceLogId) return null;
      const { data, error } = await supabase
        .from('break_logs')
        .select('*')
        .eq('attendance_log_id', attendanceLogId)
        .is('end_at', null)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!attendanceLogId,
  });
};
