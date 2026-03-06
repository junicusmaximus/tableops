import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subDays } from 'date-fns';

export interface SalesRecord {
  id: string;
  store_id: string;
  date: string;
  amount: number;
  notes: string | null;
  recorded_by: string;
  created_at: string;
}

export interface SalesTarget {
  id: string;
  store_id: string;
  year_month: string;
  target_amount: number;
  created_by: string;
}

// Fetch daily sales records for current month
export const useMonthlySales = () => {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const now = new Date();
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['sales-records', profile?.store_id, format(now, 'yyyy-MM')],
    queryFn: async () => {
      if (!profile?.store_id) return [];
      const { data, error } = await supabase
        .from('sales_records')
        .select('*')
        .eq('store_id', profile.store_id)
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .order('date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as SalesRecord[];
    },
    enabled: !!user && !!profile?.store_id,
  });
};

// Fetch monthly target for current month
export const useMonthlyTarget = () => {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const yearMonth = format(new Date(), 'yyyy-MM');

  return useQuery({
    queryKey: ['sales-target', profile?.store_id, yearMonth],
    queryFn: async () => {
      if (!profile?.store_id) return null;
      const { data, error } = await supabase
        .from('sales_targets')
        .select('*')
        .eq('store_id', profile.store_id)
        .eq('year_month', yearMonth)
        .maybeSingle();
      if (error) throw error;
      return data as SalesTarget | null;
    },
    enabled: !!user && !!profile?.store_id,
  });
};

// Compute summary stats
export const useSalesSummary = () => {
  const { data: records = [] } = useMonthlySales();
  const { data: target } = useMonthlyTarget();

  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const lastWeekStart = format(startOfWeek(subDays(new Date(), 7), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const lastWeekEnd = format(endOfWeek(subDays(new Date(), 7), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const todaySales = records.find((r) => r.date === today)?.amount ?? 0;
  const yesterdaySales = records.find((r) => r.date === yesterday)?.amount ?? 0;
  const dailyChange = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0;

  const weekSales = records
    .filter((r) => r.date >= weekStart && r.date <= weekEnd)
    .reduce((sum, r) => sum + Number(r.amount), 0);
  const lastWeekSales = records
    .filter((r) => r.date >= lastWeekStart && r.date <= lastWeekEnd)
    .reduce((sum, r) => sum + Number(r.amount), 0);
  const weeklyChange = lastWeekSales > 0 ? ((weekSales - lastWeekSales) / lastWeekSales) * 100 : 0;

  const monthTotal = records.reduce((sum, r) => sum + Number(r.amount), 0);
  const targetAmount = target?.target_amount ? Number(target.target_amount) : 0;
  const achievementRate = targetAmount > 0 ? (monthTotal / targetAmount) * 100 : 0;

  return {
    todaySales,
    dailyChange,
    weekSales,
    weeklyChange,
    monthTotal,
    targetAmount,
    achievementRate,
  };
};

// Add/update daily sales
export const useUpsertSalesRecord = () => {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, amount, notes }: { date: string; amount: number; notes?: string }) => {
      if (!user || !profile?.store_id) throw new Error('Not authenticated');

      // Check if record exists for this date
      const { data: existing } = await supabase
        .from('sales_records')
        .select('id')
        .eq('store_id', profile.store_id)
        .eq('date', date)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('sales_records')
          .update({ amount, notes })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sales_records')
          .insert({
            store_id: profile.store_id,
            date,
            amount,
            notes: notes ?? null,
            recorded_by: user.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-records'] });
    },
  });
};

// Set monthly target
export const useUpsertSalesTarget = () => {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ yearMonth, targetAmount }: { yearMonth: string; targetAmount: number }) => {
      if (!user || !profile?.store_id) throw new Error('Not authenticated');

      const { data: existing } = await supabase
        .from('sales_targets')
        .select('id')
        .eq('store_id', profile.store_id)
        .eq('year_month', yearMonth)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('sales_targets')
          .update({ target_amount: targetAmount })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sales_targets')
          .insert({
            store_id: profile.store_id,
            year_month: yearMonth,
            target_amount: targetAmount,
            created_by: user.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-target'] });
    },
  });
};

// Delete a sales record
export const useDeleteSalesRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sales_records').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-records'] });
    },
  });
};
