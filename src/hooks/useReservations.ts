import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export interface Reservation {
  id: string;
  store_id: string;
  reservation_source: string;
  customer_name: string;
  phone_number: string | null;
  reservation_date: string;
  reservation_time: string;
  guest_count: number;
  seating_area: string | null;
  status: string;
  memo: string | null;
  special_request: string | null;
  vip_flag: boolean;
  created_by: string;
  created_at: string;
}

export const RESERVATION_STATUSES = ['예약 확정', '방문 완료', '노쇼', '취소', '대기'] as const;

export const useTodayReservations = () => {
  const { data: profile } = useEmployeeProfile();
  const today = format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['reservations', profile?.store_id, today],
    queryFn: async () => {
      if (!profile?.store_id) return [];
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('store_id', profile.store_id)
        .eq('reservation_date', today)
        .order('reservation_time');
      if (error) throw error;
      return (data ?? []) as Reservation[];
    },
    enabled: !!profile?.store_id,
  });
};

export const useReservationsByDate = (date: string) => {
  const { data: profile } = useEmployeeProfile();

  return useQuery({
    queryKey: ['reservations', profile?.store_id, date],
    queryFn: async () => {
      if (!profile?.store_id) return [];
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('store_id', profile.store_id)
        .eq('reservation_date', date)
        .order('reservation_time');
      if (error) throw error;
      return (data ?? []) as Reservation[];
    },
    enabled: !!profile?.store_id,
  });
};

export const useCreateReservation = () => {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      customer_name: string;
      phone_number?: string;
      reservation_date: string;
      reservation_time: string;
      guest_count: number;
      seating_area?: string;
      memo?: string;
      special_request?: string;
      vip_flag?: boolean;
    }) => {
      if (!user || !profile) throw new Error('인증이 필요합니다');
      const { error } = await supabase.from('reservations').insert({
        store_id: profile.store_id,
        customer_name: input.customer_name,
        phone_number: input.phone_number ?? null,
        reservation_date: input.reservation_date,
        reservation_time: input.reservation_time,
        guest_count: input.guest_count,
        seating_area: input.seating_area ?? null,
        memo: input.memo ?? null,
        special_request: input.special_request ?? null,
        vip_flag: input.vip_flag ?? false,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast({ title: '예약 등록 완료' });
    },
    onError: (e: Error) => {
      toast({ title: '예약 등록 실패', description: e.message, variant: 'destructive' });
    },
  });
};

export const useUpdateReservationStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('reservations')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast({ title: '예약 상태 변경 완료' });
    },
  });
};
