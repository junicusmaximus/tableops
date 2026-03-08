import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';

export interface PurchaseRequest {
  id: string;
  store_id: string;
  item_name: string;
  item_id: string | null;
  quantity: number;
  unit: string;
  supplier: string | null;
  notes: string | null;
  requested_by: string;
  approved_by: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  requester_name?: string;
  approver_name?: string;
}

export interface InventoryAlert {
  id: string;
  store_id: string;
  item_id: string;
  alert_type: string;
  message: string;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  item_name?: string;
  current_stock?: number;
  minimum_stock?: number;
  unit?: string;
}

const db = supabase as any;

export const usePurchaseRequests = () => {
  const { data: profile } = useEmployeeProfile();

  return useQuery({
    queryKey: ['purchase-requests', profile?.store_id],
    queryFn: async (): Promise<PurchaseRequest[]> => {
      if (!profile?.store_id) return [];

      const { data, error } = await db
        .from('purchase_requests')
        .select('*')
        .eq('store_id', profile.store_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich with names
      const userIds = [...new Set((data ?? []).flatMap((d: any) => [d.requested_by, d.approved_by].filter(Boolean)))];
      const { data: profiles } = await db
        .from('employee_profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const nameMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p.full_name]));

      return (data ?? []).map((d: any) => ({
        ...d,
        requester_name: nameMap.get(d.requested_by) ?? '알 수 없음',
        approver_name: d.approved_by ? nameMap.get(d.approved_by) : null,
      }));
    },
    enabled: !!profile?.store_id,
  });
};

export const useCreatePurchaseRequest = () => {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      item_name: string;
      item_id?: string;
      quantity: number;
      unit: string;
      supplier?: string;
      notes?: string;
    }) => {
      if (!user || !profile?.store_id) throw new Error('Not authenticated');

      const { error } = await db.from('purchase_requests').insert({
        store_id: profile.store_id,
        item_name: input.item_name,
        item_id: input.item_id ?? null,
        quantity: input.quantity,
        unit: input.unit,
        supplier: input.supplier ?? null,
        notes: input.notes ?? null,
        requested_by: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
    },
  });
};

export const useUpdatePurchaseRequest = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (!user) throw new Error('Not authenticated');

      const updates: any = { status };
      if (status === 'approved' || status === 'rejected') {
        updates.approved_by = user.id;
      }

      const { error } = await db
        .from('purchase_requests')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
    },
  });
};

export const useInventoryAlerts = () => {
  const { data: profile } = useEmployeeProfile();

  return useQuery({
    queryKey: ['inventory-alerts', profile?.store_id],
    queryFn: async (): Promise<InventoryAlert[]> => {
      if (!profile?.store_id) return [];

      const { data, error } = await db
        .from('inventory_alerts')
        .select('*')
        .eq('store_id', profile.store_id)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich with item info
      const itemIds = [...new Set((data ?? []).map((d: any) => d.item_id))];
      if (itemIds.length === 0) return data ?? [];

      const { data: items } = await db
        .from('inventory_items')
        .select('id, item_name, current_stock, minimum_stock, default_unit')
        .in('id', itemIds);

      const itemMap = new Map((items ?? []).map((i: any) => [i.id, i]));

      return (data ?? []).map((d: any) => {
        const item = itemMap.get(d.item_id);
        return {
          ...d,
          item_name: item?.item_name ?? '알 수 없음',
          current_stock: item?.current_stock ?? 0,
          minimum_stock: item?.minimum_stock ?? 0,
          unit: item?.default_unit ?? 'kg',
        };
      });
    },
    enabled: !!profile?.store_id,
  });
};

export const useCheckAndCreateAlerts = () => {
  const { data: profile } = useEmployeeProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!profile?.store_id) return;

      // Get all items with minimum_stock set
      const { data: items } = await db
        .from('inventory_items')
        .select('id, item_name, current_stock, minimum_stock, default_unit')
        .eq('store_id', profile.store_id)
        .eq('is_active', true)
        .gt('minimum_stock', 0);

      if (!items?.length) return;

      // Get existing unresolved alerts
      const { data: existingAlerts } = await db
        .from('inventory_alerts')
        .select('item_id')
        .eq('store_id', profile.store_id)
        .eq('is_resolved', false);

      const alertedItemIds = new Set((existingAlerts ?? []).map((a: any) => a.item_id));

      // Find items below minimum stock
      const lowStockItems = items.filter(
        (i: any) => i.current_stock < i.minimum_stock && !alertedItemIds.has(i.id)
      );

      if (lowStockItems.length === 0) return;

      // Create alerts
      const alerts = lowStockItems.map((i: any) => ({
        store_id: profile.store_id,
        item_id: i.id,
        alert_type: 'low_stock',
        message: `⚠ 재고 부족: ${i.item_name} - 현재 ${i.current_stock}${i.default_unit} (최소 ${i.minimum_stock}${i.default_unit})`,
      }));

      await db.from('inventory_alerts').insert(alerts);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
    },
  });
};

export const useResolveAlert = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await db
        .from('inventory_alerts')
        .update({
          is_resolved: true,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
    },
  });
};
