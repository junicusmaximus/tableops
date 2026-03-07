import { useMemo } from 'react';
import {
  Users, Clock, TrendingUp, AlertTriangle, ClipboardCheck,
  CalendarDays, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/common/StatusBadge';
import { Progress } from '@/components/ui/progress';
import { useSalesSummary, useMonthlySales } from '@/hooks/useSales';
import { useAttendanceLogs } from '@/hooks/useAttendance';
import { useTodayChecklistRuns } from '@/hooks/useChecklists';
import { useTodayReservations } from '@/hooks/useReservations';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const formatKRW = (n: number) =>
  new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(n);

const Dashboard = () => {
  const { data: profile } = useEmployeeProfile();
  const sales = useSalesSummary();
  const { data: salesRecords = [] } = useMonthlySales();
  const { data: attendanceLogs = [] } = useAttendanceLogs(profile?.store_id);
  const { data: checklistRuns = [] } = useTodayChecklistRuns();
  const { data: reservations = [] } = useTodayReservations();

  const checkedIn = attendanceLogs.filter((a) => a.status === 'checked_in' || a.status === 'on_break').length;
  const lateCount = attendanceLogs.filter((a) => a.is_late).length;
  const clCompleted = checklistRuns.filter((r) => r.status === 'completed').length;
  const clTotal = checklistRuns.length;
  const clPercent = clTotal > 0 ? (clCompleted / clTotal) * 100 : 0;
  const confirmedRes = reservations.filter((r) => r.status === '예약 확정').length;

  const chartData = useMemo(() => {
    return salesRecords
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7)
      .map((r) => ({
        date: format(new Date(r.date), 'M/d'),
        amount: Number(r.amount),
      }));
  }, [salesRecords]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {profile?.full_name ? `${profile.full_name} · ` : ''}
          {format(new Date(), 'yyyy년 M월 d일 (EEEE)', { locale: ko })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="오늘 매출"
          value={formatKRW(sales.todaySales)}
          subtitle={sales.dailyChange !== 0 ? `전일 대비 ${sales.dailyChange > 0 ? '+' : ''}${sales.dailyChange.toFixed(1)}%` : '어제 매출 없음'}
          icon={TrendingUp}
          variant={sales.dailyChange >= 0 ? 'success' : 'destructive'}
        />
        <StatCard
          title="이번주 매출"
          value={formatKRW(sales.weekSales)}
          subtitle={`달성률 ${sales.achievementRate.toFixed(1)}%`}
          icon={TrendingUp}
          variant="default"
        />
        <StatCard
          title="오늘 출근"
          value={`${checkedIn}명`}
          subtitle={lateCount > 0 ? `지각 ${lateCount}명` : '지각 없음'}
          icon={Users}
          variant={lateCount > 0 ? 'warning' : 'success'}
        />
        <StatCard
          title="오늘 예약"
          value={`${confirmedRes}건`}
          subtitle={`총 ${reservations.length}건`}
          icon={CalendarDays}
          variant="default"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* 매출 차트 */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">최근 7일 매출</CardTitle></CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">매출 데이터가 없습니다</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                  <Tooltip formatter={(v: number) => formatKRW(v)} labelFormatter={(l) => `${l}`} />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* 체크리스트 진행률 */}
        <Card>
          <CardHeader><CardTitle className="text-base">체크리스트 진행률</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <p className="text-4xl font-bold text-primary">{clPercent.toFixed(0)}%</p>
              <p className="text-sm text-muted-foreground mt-1">{clCompleted}/{clTotal} 완료</p>
            </div>
            <Progress value={clPercent} className="h-3" />
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* 출근 현황 */}
        <Card>
          <CardHeader><CardTitle className="text-base">출근 현황</CardTitle></CardHeader>
          <CardContent>
            {attendanceLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">오늘 출근 기록이 없습니다</p>
            ) : (
              <div className="space-y-2">
                {attendanceLogs.slice(0, 8).map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{a.employee_profiles?.full_name ?? '직원'}</p>
                      <p className="text-xs text-muted-foreground">{a.employee_profiles?.position ?? ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {a.check_in_at ? new Date(a.check_in_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </span>
                      <StatusBadge
                        status={a.status === 'checked_out' ? 'success' : a.is_late ? 'warning' : a.status === 'checked_in' ? 'info' : 'default'}
                        label={a.status === 'checked_out' ? '퇴근' : a.is_late ? '지각' : a.status === 'on_break' ? '휴식' : '출근'}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 오늘 예약 */}
        <Card>
          <CardHeader><CardTitle className="text-base">오늘 예약</CardTitle></CardHeader>
          <CardContent>
            {reservations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">오늘 예약이 없습니다</p>
            ) : (
              <div className="space-y-2">
                {reservations.slice(0, 6).map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{r.customer_name} {r.vip_flag && '⭐'}</p>
                      <p className="text-xs text-muted-foreground">{r.reservation_time?.slice(0, 5)} · {r.guest_count}명</p>
                    </div>
                    <StatusBadge
                      status={r.status === '예약 확정' ? 'info' : r.status === '방문 완료' ? 'success' : r.status === '노쇼' ? 'destructive' : 'warning'}
                      label={r.status}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
