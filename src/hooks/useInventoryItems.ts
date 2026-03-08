import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface InventoryItem {
  id: string;
  store_id: string;
  item_name: string;
  english_name: string | null;
  short_code: string | null;
  aliases: string[];
  category: string;
  item_type: 'raw' | 'prep';
  default_unit: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface UsageCount {
  item_id: string;
  count: number;
}

export function useInventoryItems(storeId: string | null) {
  const { toast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [userUsage, setUserUsage] = useState<UsageCount[]>([]);
  const [storeUsage, setStoreUsage] = useState<UsageCount[]>([]);

  const fetchItems = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('inventory_items')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('item_name');
    if (error) {
      console.error('Failed to fetch inventory items', error);
    } else {
      setItems((data as InventoryItem[]) || []);
    }
    setLoading(false);
  }, [storeId]);

  const fetchUsage = useCallback(async () => {
    if (!storeId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: uData } = await (supabase as any)
      .from('item_usage_history')
      .select('item_id')
      .eq('user_id', user.id)
      .eq('store_id', storeId);

    if (uData) {
      const counts: Record<string, number> = {};
      (uData as any[]).forEach((r: any) => { counts[r.item_id] = (counts[r.item_id] || 0) + 1; });
      setUserUsage(Object.entries(counts).map(([item_id, count]) => ({ item_id, count })));
    }

    const { data: sData } = await (supabase as any)
      .from('item_usage_history')
      .select('item_id')
      .eq('store_id', storeId);

    if (sData) {
      const counts: Record<string, number> = {};
      (sData as any[]).forEach((r: any) => { counts[r.item_id] = (counts[r.item_id] || 0) + 1; });
      setStoreUsage(Object.entries(counts).map(([item_id, count]) => ({ item_id, count })));
    }
  }, [storeId]);

  useEffect(() => {
    fetchItems();
    fetchUsage();
  }, [fetchItems, fetchUsage]);

  const recordUsage = useCallback(async (itemId: string, queryText: string) => {
    if (!storeId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await (supabase as any).from('item_usage_history').insert({
      user_id: user.id,
      store_id: storeId,
      item_id: itemId,
      query_text: queryText,
    });
    setUserUsage(prev => {
      const existing = prev.find(u => u.item_id === itemId);
      if (existing) return prev.map(u => u.item_id === itemId ? { ...u, count: u.count + 1 } : u);
      return [...prev, { item_id: itemId, count: 1 }];
    });
  }, [storeId]);

  const createItem = useCallback(async (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'is_active'>) => {
    const { data, error } = await (supabase as any)
      .from('inventory_items')
      .insert(item)
      .select()
      .single();
    if (error) {
      toast({ title: '등록 실패', description: error.message, variant: 'destructive' });
      return null;
    }
    toast({ title: '등록 완료', description: `${item.item_name} 품목이 등록되었습니다.` });
    await fetchItems();
    return data as InventoryItem;
  }, [toast, fetchItems]);

  const updateItem = useCallback(async (id: string, updates: Partial<InventoryItem>) => {
    const { error } = await (supabase as any)
      .from('inventory_items')
      .update(updates)
      .eq('id', id);
    if (error) {
      toast({ title: '수정 실패', description: error.message, variant: 'destructive' });
      return false;
    }
    toast({ title: '수정 완료', description: '품목 정보가 수정되었습니다.' });
    await fetchItems();
    return true;
  }, [toast, fetchItems]);

  const searchItems = useCallback((query: string, typeFilter?: 'raw' | 'prep'): InventoryItem[] => {
    if (!query.trim()) return typeFilter ? items.filter(i => i.item_type === typeFilter) : items;

    const q = query.toLowerCase().trim();
    const filtered = typeFilter ? items.filter(i => i.item_type === typeFilter) : items;

    type Scored = { item: InventoryItem; score: number };
    const scored: Scored[] = [];

    for (const item of filtered) {
      let score = 0;
      const code = (item.short_code || '').toLowerCase();
      const name = item.item_name.toLowerCase();
      const eng = (item.english_name || '').toLowerCase();
      const aliases = (item.aliases || []).map(a => a.toLowerCase());

      if (code === q) { score = 100; }
      else if (code && code.startsWith(q)) { score = 90; }
      else if (name.includes(q)) { score = 70 + (name.startsWith(q) ? 10 : 0); }
      else if (eng && eng.includes(q)) { score = 60 + (eng.startsWith(q) ? 10 : 0); }
      else {
        const aliasMatch = aliases.some(a => a.includes(q));
        if (aliasMatch) score = 50;
      }

      if (score > 0) {
        const uUsage = userUsage.find(u => u.item_id === item.id);
        if (uUsage) score += Math.min(uUsage.count * 2, 20);
        const sUsage = storeUsage.find(u => u.item_id === item.id);
        if (sUsage) score += Math.min(sUsage.count, 10);
        scored.push({ item, score });
      }
    }

    return scored.sort((a, b) => b.score - a.score).map(s => s.item);
  }, [items, userUsage, storeUsage]);

  return { items, loading, searchItems, recordUsage, createItem, updateItem, fetchItems };
}
