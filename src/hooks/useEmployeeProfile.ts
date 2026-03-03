import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

export type EmployeeProfile = Tables<'employee_profiles'>;

export const useEmployeeProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['employee-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useStoreEmployees = (storeId: string | undefined) => {
  return useQuery({
    queryKey: ['store-employees', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('*')
        .eq('store_id', storeId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!storeId,
  });
};
