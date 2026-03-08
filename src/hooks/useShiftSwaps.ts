import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';

const db = supabase as any;

export interface ShiftSwap {
  id: string;
  store_id: string;
  shift_id: string;
  requester_id: string;
  accepter_id: string | null;
  status: string;
  approved_by: string | null;
  created_at: string;
  requester_name?: string;
  accepter_name?: string;
  shift_date?: string;
  start_time?: string;
  end_time?: string;
}

export const useShiftSwaps = () => {
  const { data: profile } = useEmployeeProfile();

  return useQuery({
    queryKey: ['shift-swaps', profile?.store_id],
    queryFn: async (): Promise<ShiftSwap[]> => {
      if (!profile?.store_id) return [];
      const { data, error } = await db
        .from('shift_swaps')
        .select('*')
        .eq('store_id', profile.store_id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;

      const userIds = [...new Set((data ?? []).flatMap((d: any) => [d.requester_id, d.accepter_id].filter(Boolean)))];
      const { data: profiles } = await db.from('employee_profiles').select('user_id, full_name').in('user_id', userIds);
      const nameMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p.full_name]));

      const shiftIds = [...new Set((data ?? []).map((d: any) => d.shift_id))];
      const { data: shifts } = await db.from('shifts').select('id, shift_date, start_time, end_time').in('id', shiftIds);
      const shiftMap = new Map((shifts ?? []).map((s: any) => [s.id, s]));

      return (data ?? []).map((d: any) => {
        const shift = shiftMap.get(d.shift_id);
        return {
          ...d,
          requester_name: nameMap.get(d.requester_id) ?? '알 수 없음',
          accepter_name: d.accepter_id ? nameMap.get(d.accepter_id) : null,
          shift_date: shift?.shift_date,
          start_time: shift?.start_time,
          end_time: shift?.end_time,
        };
      });
    },
    enabled: !!profile?.store_id,
  });
};

export const useCreateShiftSwap = () => {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shiftId }: { shiftId: string }) => {
      if (!user || !profile?.store_id) throw new Error('Not authenticated');
      const { error } = await db.from('shift_swaps').insert({
        store_id: profile.store_id,
        shift_id: shiftId,
        requester_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shift-swaps'] }),
  });
};

export const useAcceptShiftSwap = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (swapId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await db.from('shift_swaps').update({ accepter_id: user.id, status: 'accepted' }).eq('id', swapId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shift-swaps'] }),
  });
};

export const useApproveShiftSwap = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ swapId, approved }: { swapId: string; approved: boolean }) => {
      if (!user) throw new Error('Not authenticated');

      if (approved) {
        // Get swap details to update the shift
        const { data: swap } = await db.from('shift_swaps').select('*').eq('id', swapId).single();
        if (swap?.accepter_id) {
          await db.from('shifts').update({ user_id: swap.accepter_id }).eq('id', swap.shift_id);
        }
        await db.from('shift_swaps').update({ status: 'approved', approved_by: user.id }).eq('id', swapId);
      } else {
        await db.from('shift_swaps').update({ status: 'rejected', approved_by: user.id }).eq('id', swapId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-swaps'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
};
