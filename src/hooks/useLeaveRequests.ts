import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';

export interface LeaveRequest {
  id: string;
  applicant_user_id: string;
  store_id: string;
  approver_user_id: string | null;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  applicant_name?: string;
  applicant_position?: string;
}

export const useLeaveRequests = () => {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();

  return useQuery({
    queryKey: ['leave-requests', profile?.store_id],
    queryFn: async () => {
      if (!profile?.store_id) return [];
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('store_id', profile.store_id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Enrich with applicant names
      const userIds = [...new Set((data ?? []).map(r => r.applicant_user_id))];
      if (userIds.length === 0) return data ?? [];

      const { data: profiles } = await supabase
        .from('employee_profiles')
        .select('user_id, full_name, position')
        .in('user_id', userIds);

      const profileMap = new Map((profiles ?? []).map(p => [p.user_id, p]));

      return (data ?? []).map(r => ({
        ...r,
        applicant_name: profileMap.get(r.applicant_user_id)?.full_name ?? '알 수 없음',
        applicant_position: profileMap.get(r.applicant_user_id)?.position ?? '',
      }));
    },
    enabled: !!profile?.store_id,
  });
};

export const useCreateLeaveRequest = () => {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { leave_type: string; start_date: string; end_date: string; reason: string }) => {
      if (!user || !profile?.store_id) throw new Error('Not authenticated');

      // Insert leave request
      const { data: lr, error } = await supabase
        .from('leave_requests')
        .insert({
          applicant_user_id: user.id,
          store_id: profile.store_id,
          leave_type: input.leave_type,
          start_date: input.start_date,
          end_date: input.end_date || input.start_date,
          reason: input.reason,
          status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;

      // Find manager-level users in the same store
      const { data: managers } = await supabase
        .from('user_store_roles')
        .select('user_id')
        .eq('store_id', profile.store_id)
        .in('role', ['ceo', 'owner', 'boss', 'manager']);

      // Check each manager's notification preferences
      const managerIds = (managers ?? []).map(m => m.user_id).filter(id => id !== user.id);

      if (managerIds.length > 0) {
        // Get preferences for these managers
        const { data: prefs } = await supabase
          .from('notification_preferences')
          .select('user_id, enable_all, enable_leave_request')
          .in('user_id', managerIds);

        const prefMap = new Map((prefs ?? []).map(p => [p.user_id, p]));

        const notifications = managerIds
          .filter(mid => {
            const pref = prefMap.get(mid);
            // Default: enabled if no preference exists
            if (!pref) return true;
            return pref.enable_all !== false && pref.enable_leave_request !== false;
          })
          .map(mid => ({
            user_id: mid,
            type: 'leave_request',
            title: '새 휴가 신청이 접수되었습니다.',
            message: `${profile.full_name}님이 ${input.leave_type} 휴가를 신청했습니다. (${input.start_date}${input.start_date !== (input.end_date || input.start_date) ? ' ~ ' + (input.end_date || input.start_date) : ''})`,
            related_entity_type: 'leave_request',
            related_entity_id: lr.id,
            created_by: user.id,
          }));

        if (notifications.length > 0) {
          await supabase.from('notifications').insert(notifications);
        }
      }

      return lr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave-requests'] });
    },
  });
};

export const useApproveLeaveRequest = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (leaveId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data: lr, error } = await supabase
        .from('leave_requests')
        .update({ status: 'approved', approver_user_id: user.id, updated_at: new Date().toISOString() })
        .eq('id', leaveId)
        .select()
        .single();
      if (error) throw error;

      // Check applicant's notification preferences
      const { data: pref } = await supabase
        .from('notification_preferences')
        .select('enable_all, enable_leave_result')
        .eq('user_id', lr.applicant_user_id)
        .maybeSingle();

      const shouldNotify = !pref || (pref.enable_all !== false && pref.enable_leave_result !== false);

      if (shouldNotify) {
        await supabase.from('notifications').insert({
          user_id: lr.applicant_user_id,
          type: 'leave_approved',
          title: '휴가 신청이 승인되었습니다.',
          message: `${lr.leave_type} 휴가 (${lr.start_date}${lr.start_date !== lr.end_date ? ' ~ ' + lr.end_date : ''})가 승인되었습니다.`,
          related_entity_type: 'leave_request',
          related_entity_id: lr.id,
          created_by: user.id,
        });
      }

      return lr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave-requests'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useRejectLeaveRequest = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ leaveId, rejectionReason }: { leaveId: string; rejectionReason?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data: lr, error } = await supabase
        .from('leave_requests')
        .update({
          status: 'rejected',
          approver_user_id: user.id,
          rejection_reason: rejectionReason || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leaveId)
        .select()
        .single();
      if (error) throw error;

      // Check applicant's notification preferences
      const { data: pref } = await supabase
        .from('notification_preferences')
        .select('enable_all, enable_leave_result')
        .eq('user_id', lr.applicant_user_id)
        .maybeSingle();

      const shouldNotify = !pref || (pref.enable_all !== false && pref.enable_leave_result !== false);

      if (shouldNotify) {
        await supabase.from('notifications').insert({
          user_id: lr.applicant_user_id,
          type: 'leave_rejected',
          title: '휴가 신청이 반려되었습니다.',
          message: `${lr.leave_type} 휴가 (${lr.start_date}${lr.start_date !== lr.end_date ? ' ~ ' + lr.end_date : ''})가 반려되었습니다.${rejectionReason ? ' 사유: ' + rejectionReason : ''}`,
          related_entity_type: 'leave_request',
          related_entity_id: lr.id,
          created_by: user.id,
        });
      }

      return lr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave-requests'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
