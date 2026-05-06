import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import type { SalesRow } from '@/lib/salesAnalytics';

export interface SalesFilters {
  storeIds: string[];
  from: string; // yyyy-MM-dd
  to: string;
  paymentMethod?: string | null;
  salesChannel?: string | null;
  /** Include previous-year same period for YoY analysis */
  includePrevYear?: boolean;
}

export const useSalesRecords = (filters: SalesFilters | null, enabled = true) => {
  const { data: profile } = useEmployeeProfile();
  return useQuery({
    queryKey: ['sales-records-v2', filters, profile?.organization_id],
    queryFn: async (): Promise<SalesRow[]> => {
      if (!filters || filters.storeIds.length === 0) return [];
      const buildRanges = () => {
        const ranges: Array<{ from: string; to: string }> = [{ from: filters.from, to: filters.to }];
        if (filters.includePrevYear) {
          const fromYear = Number(filters.from.slice(0, 4)) - 1;
          const toYear = Number(filters.to.slice(0, 4)) - 1;
          ranges.push({
            from: `${fromYear}${filters.from.slice(4)}`,
            to: `${toYear}${filters.to.slice(4)}`,
          });
        }
        return ranges;
      };

      const all: SalesRow[] = [];
      for (const range of buildRanges()) {
        let q = supabase
          .from('sales_records')
          .select('id, store_id, business_date, date, sales_datetime, sales_hour, weekday, payment_method, sales_channel, net_sales, amount, card_sales, cash_sales, delivery_sales, alcohol_sales, source_type')
          .in('store_id', filters.storeIds)
          .or(`business_date.gte.${range.from},date.gte.${range.from}`)
          .or(`business_date.lte.${range.to},date.lte.${range.to}`)
          .order('business_date', { ascending: false })
          .limit(5000);
        if (filters.paymentMethod) q = q.eq('payment_method', filters.paymentMethod);
        if (filters.salesChannel) q = q.eq('sales_channel', filters.salesChannel);
        const { data, error } = await q;
        if (error) throw error;
        // Filter again client-side (the OR-based date filter is permissive)
        (data ?? []).forEach((r: any) => {
          const d = r.business_date ?? r.date;
          if (d && d >= range.from && d <= range.to) all.push(r as SalesRow);
        });
      }
      return all;
    },
    enabled: enabled && !!filters && filters.storeIds.length > 0,
  });
};

export interface ManualSalesEntry {
  store_id: string;
  business_date: string;
  sales_datetime?: string | null;
  payment_method?: string | null;
  sales_channel?: string | null;
  gross_sales?: number;
  discount_amount?: number;
  refund_amount?: number;
  net_sales: number;
  vat_amount?: number;
  card_sales?: number;
  cash_sales?: number;
  delivery_sales?: number;
  alcohol_sales?: number;
  memo?: string;
}

export const useInsertManualSale = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: ManualSalesEntry) => {
      if (!user) throw new Error('인증이 필요합니다.');
      const { error } = await supabase.from('sales_records').insert({
        store_id: entry.store_id,
        business_date: entry.business_date,
        date: entry.business_date,
        sales_datetime: entry.sales_datetime ?? `${entry.business_date}T12:00:00+09:00`,
        payment_method: entry.payment_method ?? null,
        sales_channel: entry.sales_channel ?? null,
        gross_sales: entry.gross_sales ?? entry.net_sales,
        discount_amount: entry.discount_amount ?? 0,
        refund_amount: entry.refund_amount ?? 0,
        net_sales: entry.net_sales,
        amount: entry.net_sales,
        vat_amount: entry.vat_amount ?? 0,
        card_sales: entry.card_sales ?? 0,
        cash_sales: entry.cash_sales ?? 0,
        delivery_sales: entry.delivery_sales ?? 0,
        alcohol_sales: entry.alcohol_sales ?? 0,
        memo: entry.memo,
        source_type: 'manual',
        created_by: user.id,
        recorded_by: user.id,
      } as any);
      if (error) throw error;
      await supabase.from('sales_audit_logs' as any).insert({
        user_id: user.id,
        action_type: 'sales_record_created',
        store_id: entry.store_id,
        target_period: entry.business_date,
        metadata: { source: 'manual', amount: entry.net_sales },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sales-records-v2'] }),
  });
};

export const useLogSalesView = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { storeIds: string[]; period: string }) => {
      if (!user) return;
      await supabase.from('sales_audit_logs' as any).insert({
        user_id: user.id,
        action_type: 'sales_viewed',
        store_id: input.storeIds[0] ?? null,
        target_period: input.period,
        metadata: { stores: input.storeIds },
      });
    },
  });
};

export const useStoresForUser = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-stores', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: roles } = await supabase
        .from('user_store_roles')
        .select('store_id')
        .eq('user_id', user.id);
      const storeIds = Array.from(new Set((roles ?? []).map((r: any) => r.store_id).filter(Boolean)));
      if (storeIds.length === 0) return [];
      const { data: stores } = await supabase.from('stores').select('id, name').in('id', storeIds);
      return (stores ?? []) as Array<{ id: string; name: string }>;
    },
    enabled: !!user,
  });
};

export interface ImportRow {
  business_date: string;
  net_sales: number;
  payment_method?: string | null;
  sales_channel?: string | null;
  card_sales?: number;
  cash_sales?: number;
  delivery_sales?: number;
  alcohol_sales?: number;
  memo?: string | null;
  transaction_id?: string | null;
  sales_datetime?: string | null;
}

export const useImportSales = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ storeId, rows, fileName }: { storeId: string; rows: ImportRow[]; fileName: string }) => {
      if (!user) throw new Error('인증이 필요합니다.');
      // Duplicate detection: by transaction_id or (date+net_sales)
      const dates = Array.from(new Set(rows.map((r) => r.business_date)));
      const { data: existing } = await supabase
        .from('sales_records')
        .select('business_date, net_sales, transaction_id')
        .eq('store_id', storeId)
        .in('business_date', dates as any);
      const existingKeys = new Set(
        (existing ?? []).map((e: any) => e.transaction_id || `${e.business_date}|${e.net_sales}`)
      );
      const fresh = rows.filter((r) => {
        const key = r.transaction_id || `${r.business_date}|${r.net_sales}`;
        return !existingKeys.has(key);
      });
      const dupCount = rows.length - fresh.length;

      const { data: batch, error: batchErr } = await supabase
        .from('sales_import_batches' as any)
        .insert({
          store_id: storeId,
          uploaded_by: user.id,
          file_name: fileName,
          row_count: rows.length,
          imported_count: fresh.length,
          duplicate_count: dupCount,
          status: 'imported',
        })
        .select('id')
        .single();
      if (batchErr) throw batchErr;

      if (fresh.length > 0) {
        const payload = fresh.map((r) => ({
          store_id: storeId,
          business_date: r.business_date,
          date: r.business_date,
          sales_datetime: r.sales_datetime ?? `${r.business_date}T12:00:00+09:00`,
          payment_method: r.payment_method ?? null,
          sales_channel: r.sales_channel ?? null,
          net_sales: r.net_sales,
          amount: r.net_sales,
          gross_sales: r.net_sales,
          card_sales: r.card_sales ?? 0,
          cash_sales: r.cash_sales ?? 0,
          delivery_sales: r.delivery_sales ?? 0,
          alcohol_sales: r.alcohol_sales ?? 0,
          memo: r.memo ?? null,
          transaction_id: r.transaction_id ?? null,
          source_type: 'csv_import',
          raw_source_name: fileName,
          import_batch_id: (batch as any).id,
          created_by: user.id,
          recorded_by: user.id,
        }));
        const { error } = await supabase.from('sales_records').insert(payload as any);
        if (error) throw error;
      }

      await supabase.from('sales_audit_logs' as any).insert({
        user_id: user.id,
        action_type: 'sales_imported',
        store_id: storeId,
        metadata: { file_name: fileName, total: rows.length, imported: fresh.length, duplicates: dupCount },
      });

      return { imported: fresh.length, duplicates: dupCount, total: rows.length };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sales-records-v2'] }),
  });
};
