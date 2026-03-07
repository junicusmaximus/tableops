import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useToast } from '@/hooks/use-toast';

export interface StaffMember {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  position: string | null;
  employment_type: string | null;
  hire_date: string | null;
  store_id: string;
  brand_id: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  role?: string;
}

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

      // Also fetch roles
      const userIds = (data ?? []).map((d) => d.user_id);
      if (userIds.length === 0) return [];
      const { data: roles } = await supabase
        .from('user_store_roles')
        .select('user_id, role')
        .eq('store_id', sid)
        .in('user_id', userIds);

      const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role]));
      return (data ?? []).map((d) => ({ ...d, role: roleMap.get(d.user_id) ?? 'hall_staff' })) as StaffMember[];
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
      // Create a placeholder user_id (in real app, would invite via email)
      const placeholderUserId = crypto.randomUUID();
      const { data, error } = await supabase
        .from('employee_profiles')
        .insert({
          user_id: placeholderUserId,
          full_name: input.full_name,
          phone: input.phone ?? null,
          position: input.position ?? null,
          employment_type: input.employment_type ?? 'full_time',
          hire_date: input.hire_date ?? null,
          store_id: profile.store_id,
          brand_id: profile.brand_id,
          organization_id: profile.organization_id,
        })
        .select()
        .single();
      if (error) throw error;

      // Assign role
      await supabase.from('user_store_roles').insert({
        user_id: placeholderUserId,
        store_id: profile.store_id,
        role: (input.role as any) ?? 'hall_staff',
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-list'] });
      toast({ title: '직원 추가 완료', description: '새 직원이 등록되었습니다.' });
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
