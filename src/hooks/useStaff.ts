import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useToast } from '@/hooks/use-toast';

export interface StaffMember {
  id: string;
  user_id: string | null;
  full_name: string;
  phone: string | null;
  position: string | null;
  employment_type: string | null;
  hire_date: string | null;
  store_id: string;
  brand_id: string;
  organization_id: string;
  status: string;
  invite_status: string;
  invited_at: string | null;
  linked_at: string | null;
  created_at: string;
  updated_at: string;
  role?: string;
}

export const INVITE_STATUS_LABELS: Record<string, string> = {
  pending: '초대 대기',
  linked: '연결됨',
  expired: '만료',
  cancelled: '취소',
};

export const EMPLOYEE_STATUS_LABELS: Record<string, string> = {
  active: '활성',
  inactive: '비활성',
  offline: '오프라인',
  pending: '대기',
};

export const useStaffList = (storeId?: string) => {
  const { data: profile } = useEmployeeProfile();
  const sid = storeId || profile?.store_id;

  return useQuery({
    queryKey: ['staff-list', sid],
    queryFn: async () => {
      if (!sid) return [];
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('*')
        .eq('store_id', sid)
        .order('full_name');
      if (error) throw error;

      // Fetch roles for linked employees only
      const userIds = (data ?? []).filter((d) => d.user_id).map((d) => d.user_id!);
      let roleMap = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: roles } = await supabase
          .from('user_store_roles')
          .select('user_id, role')
          .eq('store_id', sid)
          .in('user_id', userIds);
        roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role]));
      }

      return (data ?? []).map((d) => ({
        ...d,
        invite_status: (d as any).invite_status ?? 'linked',
        invited_at: (d as any).invited_at ?? null,
        linked_at: (d as any).linked_at ?? null,
        role: d.user_id ? (roleMap.get(d.user_id) ?? d.position ?? 'hall_staff') : (d.position ?? 'hall_staff'),
      })) as StaffMember[];
    },
    enabled: !!sid,
  });
};

export const useAddStaff = () => {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      full_name: string;
      phone?: string;
      position?: string;
      employment_type?: string;
      hire_date?: string;
      role?: string;
    }) => {
      if (!user || !profile) throw new Error('인증이 필요합니다');

      // Check for duplicate phone in the same store
      if (input.phone) {
        const { data: existing } = await supabase
          .from('employee_profiles')
          .select('id, full_name, invite_status, user_id')
          .eq('store_id', profile.store_id)
          .eq('phone', input.phone);

        const activeOrLinked = (existing ?? []).find(
          (e) => e.user_id !== null || (e as any).invite_status === 'linked'
        );
        if (activeOrLinked) {
          throw new Error('이미 연결된 직원 정보가 있습니다.');
        }

        const pendingDup = (existing ?? []).find(
          (e) => (e as any).invite_status === 'pending'
        );
        if (pendingDup) {
          throw new Error(`동일한 전화번호로 초대 대기 중인 직원이 있습니다. (${pendingDup.full_name})`);
        }
      }

      // Create pending employee record (no user_id needed)
      const { data, error } = await supabase
        .from('employee_profiles')
        .insert({
          user_id: null as any,
          full_name: input.full_name,
          phone: input.phone ?? null,
          position: input.role ?? input.position ?? 'hall_staff',
          employment_type: input.employment_type ?? 'full_time',
          hire_date: input.hire_date || null,
          store_id: profile.store_id,
          brand_id: profile.brand_id,
          organization_id: profile.organization_id,
          status: 'pending',
          invite_status: 'pending' as any,
          invited_by: user.id as any,
          invited_at: new Date().toISOString() as any,
        })
        .select()
        .single();
      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-list'] });
      toast({ title: '직원 등록 완료', description: '직원이 초대 대기 상태로 등록되었습니다.' });
    },
    onError: (e: Error) => {
      toast({ title: '직원 추가 실패', description: e.message, variant: 'destructive' });
    },
  });
};

export const useUpdateStaff = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StaffMember> & { id: string }) => {
      const { error } = await supabase
        .from('employee_profiles')
        .update({
          full_name: updates.full_name,
          phone: updates.phone,
          position: updates.position,
          employment_type: updates.employment_type,
          hire_date: updates.hire_date,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-list'] });
      toast({ title: '수정 완료' });
    },
    onError: (e: Error) => {
      toast({ title: '수정 실패', description: e.message, variant: 'destructive' });
    },
  });
};
