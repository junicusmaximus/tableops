import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export interface EmployeeStats {
  weeklyHours: number;
  monthlyHours: number;
  attendanceDays: number;
  lateDays: number;
  earlyLeaveDays: number;
}

export interface TeamMemberStats extends EmployeeStats {
  user_id: string;
  full_name: string;
  position: string | null;
}

export const useMyWorkStats = () => {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();

  const now = new Date();
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['my-work-stats', user?.id, profile?.store_id],
    queryFn: async (): Promise<EmployeeStats> => {
      if (!user || !profile?.store_id) {
        return { weeklyHours: 0, monthlyHours: 0, attendanceDays: 0, lateDays: 0, earlyLeaveDays: 0 };
      }

      // Get this month's attendance logs
      const { data: monthLogs } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('store_id', profile.store_id)
        .gte('date', monthStart)
        .lte('date', monthEnd);

      const logs = monthLogs ?? [];

      // Weekly hours
      const weekLogs = logs.filter((l) => l.date >= weekStart && l.date <= weekEnd);
      const weeklyHours = weekLogs.reduce((sum, l) => sum + (Number(l.work_hours) || 0), 0);

      // Monthly hours
      const monthlyHours = logs.reduce((sum, l) => sum + (Number(l.work_hours) || 0), 0);

      // Attendance days (checked_in or checked_out)
      const attendanceDays = logs.filter((l) => l.status !== 'absent').length;

      // Late days
      const lateDays = logs.filter((l) => l.is_late).length;

      // Early leave days
      const earlyLeaveDays = logs.filter((l) => l.is_early_leave).length;

      return { weeklyHours, monthlyHours, attendanceDays, lateDays, earlyLeaveDays };
    },
    enabled: !!user && !!profile?.store_id,
  });
};

export const useTeamWorkStats = () => {
  const { data: profile } = useEmployeeProfile();

  const now = new Date();
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['team-work-stats', profile?.store_id],
    queryFn: async (): Promise<TeamMemberStats[]> => {
      if (!profile?.store_id) return [];

      // Get all attendance logs for the store this month
      const { data: allLogs } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('store_id', profile.store_id)
        .gte('date', monthStart)
        .lte('date', monthEnd);

      // Get employee profiles
      const db = supabase as any;
      const { data: employees } = await db
        .from('employee_profiles')
        .select('user_id, full_name, position')
        .eq('store_id', profile.store_id);

      const logs = allLogs ?? [];
      const empList = (employees ?? []) as { user_id: string; full_name: string; position: string | null }[];

      return empList.map((emp) => {
        const empLogs = logs.filter((l) => l.user_id === emp.user_id);
        const weekLogs = empLogs.filter((l) => l.date >= weekStart && l.date <= weekEnd);

        return {
          user_id: emp.user_id,
          full_name: emp.full_name,
          position: emp.position,
          weeklyHours: weekLogs.reduce((sum, l) => sum + (Number(l.work_hours) || 0), 0),
          monthlyHours: empLogs.reduce((sum, l) => sum + (Number(l.work_hours) || 0), 0),
          attendanceDays: empLogs.filter((l) => l.status !== 'absent').length,
          lateDays: empLogs.filter((l) => l.is_late).length,
          earlyLeaveDays: empLogs.filter((l) => l.is_early_leave).length,
        };
      });
    },
    enabled: !!profile?.store_id,
  });
};
