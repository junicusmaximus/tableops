import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldAlert, Plus, Upload, TrendingUp, TrendingDown, Sparkles, BarChart3, Clock, CalendarDays, Building2, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { exportSalesExcel, exportSalesPDF } from '@/lib/salesExport';
import { toast } from 'sonner';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { format } from 'date-fns';
import { useSalesPermissions } from '@/hooks/useSalesPermissions';
import { useSalesRecords, useStoresForUser, useLogSalesView } from '@/hooks/useSalesRecords';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import {
  KRW, periodPresets, sumNet, dailyTrend, monthlyTrend, hourlyBreakdown, weekdayBreakdown,
  yearOverYear, computeInsights, filterByPeriod, WEEKDAY_LABELS,
} from '@/lib/salesAnalytics';
import EmptyState from '@/components/common/EmptyState';

const Sales = () => {
  const perms = useSalesPermissions();
  const { data: profile } = useEmployeeProfile();
  const { data: stores = [] } = useStoresForUser();

  const presets = useMemo(() => periodPresets(), []);
  const [periodKey, setPeriodKey] = useState<keyof ReturnType<typeof periodPresets> | 'custom'>('thisMonth');
  const [customFrom, setCustomFrom] = useState(presets.thisMonth.from);
  const [customTo, setCustomTo] = useState(presets.thisMonth.to);
  const [storeId, setStoreId] = useState<string>('all');
  const [paymentMethod, setPaymentMethod] = useState<string>('all');
  const [salesChannel, setSalesChannel] = useState<string>('all');
  const [trendMode, setTrendMode] = useState<'daily' | 'monthly'>('daily');
  const [exportingPdf, setExportingPdf] = useState(false);

  const range = periodKey === 'custom'
    ? { from: customFrom, to: customTo }
    : { from: presets[periodKey].from, to: presets[periodKey].to };

  const targetStoreIds = storeId === 'all' ? stores.map((s) => s.id) : [storeId];

  const { data: rows = [], isLoading } = useSalesRecords(
    perms.canView ? {
      storeIds: targetStoreIds,
      from: range.from,
      to: range.to,
      paymentMethod: paymentMethod === 'all' ? null : paymentMethod,
      salesChannel: salesChannel === 'all' ? null : salesChannel,
      includePrevYear: true,
    } : null
  );

  const logView = useLogSalesView();
  useEffect(() => {
    if (perms.canView && targetStoreIds.length > 0) {
      logView.mutate({ storeIds: targetStoreIds, period: `${range.from}~${range.to}` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perms.canView, storeId, periodKey]);

  // ── Permission gates ─────────────────────────────────
  if (perms.loading) {
    return <div className="p-8 text-center text-muted-foreground text-sm">로딩 중...</div>;
  }
  if (!perms.canView) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <ShieldAlert className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-base font-medium text-foreground">
            {perms.blockedReason ?? '대표자 권한 설정에 의해 매출 분석 접근이 제한되었습니다.'}
          </p>
          <p className="text-sm text-muted-foreground mt-2">권한이 필요한 경우 대표자에게 문의해 주세요.</p>
        </CardContent>
      </Card>
    );
  }

  const periodRows = filterByPeriod(rows, range.from, range.to);
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todaySales = sumNet(filterByPeriod(rows, todayStr, todayStr));
  const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
  const monthEnd = format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd');
  const monthTotal = sumNet(filterByPeriod(rows, monthStart, monthEnd));

  const yoy = yearOverYear(rows, new Date());
  const trend = trendMode === 'daily' ? dailyTrend(periodRows) : monthlyTrend(periodRows);
  const hourly = hourlyBreakdown(periodRows);
  const weekday = weekdayBreakdown(periodRows);
  const insights = computeInsights(periodRows, new Date());

  // Daily average over the period
  const uniqueDays = new Set(periodRows.map((r) => r.business_date ?? r.date)).size || 1;
  const dailyAvg = sumNet(periodRows) / uniqueDays;

  const peakWeekday = [...weekday].sort((a, b) => b.total - a.total)[0];
  const peakHour = [...hourly].sort((a, b) => b.total - a.total)[0];

  // Branch comparison data
  const branchData = useMemo(() => {
    if (!perms.canViewBranchComparison || stores.length < 2) return [];
    const map = new Map<string, number>();
    periodRows.forEach((r) => {
      map.set(r.store_id, (map.get(r.store_id) ?? 0) + Number(r.net_sales ?? r.amount ?? 0));
    });
    return stores.map((s) => ({ name: s.name, total: map.get(s.id) ?? 0 }));
  }, [periodRows, stores, perms.canViewBranchComparison]);

  const yoyChartData = [
    { label: '전년 동월', total: yoy.prevTotal },
    { label: '이번 월', total: yoy.currentTotal },
  ];

  const storeLabel = storeId === 'all' ? '전체 매장' : (stores.find((s) => s.id === storeId)?.name ?? '-');

  const handleExcelExport = () => {
    try {
      exportSalesExcel({ rows, from: range.from, to: range.to, storeLabel, stores });
      toast.success('Excel 파일이 다운로드되었습니다.');
    } catch (e: any) {
      toast.error(e?.message ?? 'Excel 내보내기 실패');
    }
  };

  const handlePdfExport = async () => {
    try {
      setExportingPdf(true);
      await exportSalesPDF('sales-dashboard-export', range.from, range.to, storeLabel);
      toast.success('PDF 파일이 다운로드되었습니다.');
    } catch (e: any) {
      toast.error(e?.message ?? 'PDF 내보내기 실패');
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">매출 분석</h1>
          <p className="text-muted-foreground text-sm mt-1">기간별·채널별 매출 추이와 인사이트</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExcelExport} disabled={rows.length === 0}>
            <FileSpreadsheet className="w-4 h-4 mr-1" />Excel 내보내기
          </Button>
          <Button variant="outline" size="sm" onClick={handlePdfExport} disabled={rows.length === 0 || exportingPdf}>
            {exportingPdf ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileText className="w-4 h-4 mr-1" />}
            PDF 내보내기
          </Button>
          <Link to="/sales/import"><Button variant="outline" size="sm"><Upload className="w-4 h-4 mr-1" />CSV 업로드</Button></Link>
          <Link to="/sales/entry"><Button size="sm"><Plus className="w-4 h-4 mr-1" />매출 입력</Button></Link>
        </div>
      </div>

      <div id="sales-dashboard-export" className="space-y-4 bg-background p-1">


      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">매장</label>
              <Select value={storeId} onValueChange={setStoreId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 매장</SelectItem>
                  {stores.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">기간</label>
              <Select value={periodKey} onValueChange={(v: any) => setPeriodKey(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">오늘</SelectItem>
                  <SelectItem value="thisWeek">이번 주</SelectItem>
                  <SelectItem value="thisMonth">이번 달</SelectItem>
                  <SelectItem value="lastMonth">지난 달</SelectItem>
                  <SelectItem value="thisYear">올해</SelectItem>
                  <SelectItem value="custom">사용자 지정</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">결제수단</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="card">카드</SelectItem>
                  <SelectItem value="cash">현금</SelectItem>
                  <SelectItem value="delivery">배달</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">판매채널</label>
              <Select value={salesChannel} onValueChange={setSalesChannel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="dine_in">매장</SelectItem>
                  <SelectItem value="delivery">배달</SelectItem>
                  <SelectItem value="takeout">포장</SelectItem>
                  <SelectItem value="reservation">예약</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {periodKey === 'custom' && (
              <div className="col-span-2 md:col-span-1 grid grid-cols-2 gap-2">
                <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
                <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* No-data state */}
      {!isLoading && rows.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              title="매출 분석을 위한 데이터가 없습니다."
              description="매출 데이터를 직접 입력하거나 CSV로 업로드해주세요."
              icon={BarChart3}
              action={
                <div className="flex gap-2">
                  <Link to="/sales/entry"><Button size="sm"><Plus className="w-4 h-4 mr-1" />매출 직접 입력</Button></Link>
                  <Link to="/sales/import"><Button variant="outline" size="sm"><Upload className="w-4 h-4 mr-1" />CSV 업로드</Button></Link>
                  <Link to="/settings"><Button variant="ghost" size="sm">연동 설정으로 이동</Button></Link>
                </div>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard title="오늘 매출" value={KRW(todaySales)} />
            <KpiCard title="이번달 누적" value={KRW(monthTotal)} />
            <KpiCard title="전년 동월" value={yoy.hasPrev ? KRW(yoy.prevTotal) : '데이터 없음'} />
            <KpiCard
              title="전년 동월 대비"
              value={yoy.hasPrev ? `${yoy.growthPct >= 0 ? '+' : ''}${yoy.growthPct.toFixed(1)}%` : '-'}
              trend={yoy.hasPrev ? (yoy.growthPct >= 0 ? 'up' : 'down') : undefined}
            />
            <KpiCard title="평균 일매출" value={KRW(dailyAvg)} />
            <KpiCard title="최고 매출 요일" value={peakWeekday?.total ? `${peakWeekday.label}요일` : '-'} />
            <KpiCard title="최고 매출 시간대" value={peakHour?.total ? peakHour.label : '-'} />
            <KpiCard title="기간 합계" value={KRW(sumNet(periodRows))} />
          </div>

          {/* Trend */}
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4" /> 매출 추이</CardTitle>
              <Tabs value={trendMode} onValueChange={(v: any) => setTrendMode(v)}>
                <TabsList>
                  <TabsTrigger value="daily">일별</TabsTrigger>
                  <TabsTrigger value="monthly">월별</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey={trendMode === 'daily' ? 'date' : 'month'} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                  <Tooltip formatter={(v: number) => KRW(v)} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* YoY + Insights */}
          <div className="grid md:grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">전년 동일월 비교</CardTitle></CardHeader>
              <CardContent>
                {yoy.hasPrev ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={yoyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                        <Tooltip formatter={(v: number) => KRW(v)} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      {yoy.growthPct >= 0
                        ? <Badge className="bg-emerald-500/15 text-emerald-500"><TrendingUp className="w-3 h-3 mr-1" />매출 증가 {yoy.growthPct.toFixed(1)}%</Badge>
                        : <Badge className="bg-destructive/15 text-destructive"><TrendingDown className="w-3 h-3 mr-1" />매출 감소 {Math.abs(yoy.growthPct).toFixed(1)}%</Badge>}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-12">전년 동월 데이터가 없습니다.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> 인사이트</CardTitle></CardHeader>
              <CardContent>
                {insights.length === 0
                  ? <p className="text-sm text-muted-foreground">인사이트를 도출할 데이터가 부족합니다.</p>
                  : <ul className="space-y-2">{insights.map((s, i) => (
                      <li key={i} className="text-sm flex gap-2"><span className="text-primary">•</span><span>{s}</span></li>
                    ))}</ul>}
              </CardContent>
            </Card>
          </div>

          {/* Hourly + Weekday */}
          <div className="grid md:grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4" /> 시간대별 매출</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={hourly.filter((h) => h.total > 0)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                    <Tooltip formatter={(v: number) => KRW(v)} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><CalendarDays className="w-4 h-4" /> 요일별 매출</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={weekday}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                    <Tooltip formatter={(v: number) => KRW(v)} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Branch comparison */}
          {branchData.length >= 2 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4" /> 지점별 매출 비교</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={branchData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                    <Tooltip formatter={(v: number) => KRW(v)} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, trend }: { title: string; value: string; trend?: 'up' | 'down' }) => (
  <Card>
    <CardContent className="pt-4">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className={`text-lg font-bold mt-1 ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-destructive' : ''}`}>{value}</p>
    </CardContent>
  </Card>
);

export default Sales;
