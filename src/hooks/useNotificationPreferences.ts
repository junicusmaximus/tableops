import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface NotificationPreference {
  id: string;
  user_id: string;
  enable_all: boolean;
  enable_leave_request: boolean;
  enable_leave_result: boolean;
  updated_at: string;
}

const DEFAULTS: Omit<NotificationPreference, 'id' | 'user_id' | 'updated_at'> = {
  enable_all: true,
  enable_leave_request: true,
  enable_leave_result: true,
};

export const useNotificationPreferences = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as NotificationPreference | null;
    },
    enabled: !!user,
  });
};

export const useUpdateNotificationPreferences = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Pick<NotificationPreference, 'enable_all' | 'enable_leave_request' | 'enable_leave_result'>>) => {
      if (!user) throw new Error('Not authenticated');

      // Try upsert
      const { data: existing } = await supabase
        .from('notification_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('notification_preferences')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notification_preferences')
          .insert({ user_id: user.id, ...DEFAULTS, ...updates });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });
};
