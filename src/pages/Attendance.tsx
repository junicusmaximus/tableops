import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { Clock, LogIn, LogOut, Coffee, Loader2 } from 'lucide-react';
import { useEmployeeProfile, useStoreEmployees } from '@/hooks/useEmployeeProfile';
import {
  useAttendanceLogs,
  useMyTodayAttendance,
  useCheckIn,
  useCheckOut,
  useStartBreak,
  useEndBreak,
  useActiveBreak,
} from '@/hooks/useAttendance';
import { format } from 'date-fns';

const Attendance = () => {
  const { data: profile, isLoading: profileLoading } = useEmployeeProfile();
  const storeId = profile?.store_id;

  const { data: attendanceLogs, isLoading: logsLoading } = useAttendanceLogs(storeId);
  const { data: myAttendance } = useMyTodayAttendance(storeId);
  const { data: activeBreak } = useActiveBreak(myAttendance?.id);
  const { data: storeEmployees } = useStoreEmployees(storeId);

  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const startBreak = useStartBreak();
  const endBreak = useEndBreak();

  const isLoading = profileLoading || logsLoading;

  const handleCheckIn = () => {
    if (!profile || !storeId) return;
    checkIn.mutate({ employeeProfileId: profile.id, storeId });
  };

  const handleCheckOut = () => {
    if (!myAttendance) return;
    checkOut.mutate(myAttendance.id);
  };

  const handleBreakToggle = () => {
    if (!myAttendance) return;
    if (activeBreak) {
      endBreak.mutate(activeBreak.id);
    } else {
      startBreak.mutate(myAttendance.id);
    }
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '-';
    return format(new Date(isoString), 'HH:mm');
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'checked_in': return '근무중';
      case 'on_break': return '휴식중';
      case 'checked_out': return '퇴근';
      default: return status;
    }
  };

  const getStatusBadgeType = (status: string) => {
    switch (status) {
      case 'checked_in': return 'success' as const;
      case 'on_break': return 'warning' as const;
      case 'checked_out': return 'default' as const;
      default: return 'info' as const;
    }
  };

  // Build employee map for displaying names
  const employeeMap = new Map(
    (storeEmployees ?? []).map(ep => [ep.id, ep])
  );

  // Summary counts
  const checkedInCount = (attendanceLogs ?? []).filter(a => a.status === 'checked_in' || a.status === 'on_break').length;
  const checkedOutCount = (attendanceLogs ?? []).filter(a => a.status === 'checked_out').length;
  const lateCount = (attendanceLogs ?? []).filter(a => a.is_late).length;
  const totalEmployees = storeEmployees?.length ?? 0;
  const notCheckedIn = totalEmployees - (attendanceLogs ?? []).length;

  // Determine action button state
  const isCheckedIn = !!myAttendance && myAttendance.status !== 'checked_out';
  const isCheckedOut = myAttendance?.status === 'checked_out';
  const isOnBreak = myAttendance?.status === 'on_break';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-4 animate-fade-in">
        <h1 className="text-2xl font-bold">출퇴근 관리</h1>
        <EmptyState
          icon={Clock}
          title="프로필을 찾을 수 없습니다"
          description="관리자에게 매장 배정을 요청해주세요."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">출퇴근 관리</h1>
          <p className="text-muted-foreground text-sm mt-1">오늘의 출퇴근 현황</p>
        </div>
        <div className="flex gap-2">
          {isCheckedIn && !isCheckedOut && (
            <>
              <Button
                variant="outline"
                onClick={handleBreakToggle}
                disabled={startBreak.isPending || endBreak.isPending}
              >
                <Coffee className="w-4 h-4 mr-2" />
                {isOnBreak ? '휴식 종료' : '휴식 시작'}
              </Button>
              <Button
                variant="destructive"
                onClick={handleCheckOut}
                disabled={checkOut.isPending}
              >
                <LogOut className="w-4 h-4 mr-2" />
                퇴근
              </Button>
            </>
          )}
          {!myAttendance && (
            <Button onClick={handleCheckIn} disabled={checkIn.isPending}>
              {checkIn.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Clock className="w-4 h-4 mr-2" />
              )}
              출근 체크
            </Button>
          )}
        </div>
      </div>

      {/* My Status Card */}
      {myAttendance && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">내 출퇴근</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  출근: {formatTime(myAttendance.check_in_at)} · 퇴근: {formatTime(myAttendance.check_out_at)}
                </p>
              </div>
              <StatusBadge status={getStatusBadgeType(myAttendance.status)} label={getStatusLabel(myAttendance.status)} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '전체', value: totalEmployees, color: 'text-foreground' },
          { label: '근무중', value: checkedInCount, color: 'text-success' },
          { label: '지각', value: lateCount, color: 'text-warning' },
          { label: '미출근', value: notCheckedIn > 0 ? notCheckedIn : 0, color: 'text-destructive' },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">출퇴근 기록</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(!attendanceLogs || attendanceLogs.length === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-6">오늘 출퇴근 기록이 없습니다.</p>
          ) : (
            attendanceLogs.map((log) => {
              const emp = employeeMap.get(log.employee_profile_id);
              const name = (log as any).employee_profiles?.full_name ?? emp?.full_name ?? '알 수 없음';
              const position = (log as any).employee_profiles?.position ?? emp?.position ?? '';
              const breaks: any[] = (log as any).break_logs ?? [];
              const totalBreakMin = breaks.reduce((sum: number, b: any) => sum + (b.duration_minutes ?? 0), 0);
              return (
                <div key={log.id} className="py-3 border-b border-border last:border-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                        {name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{name}</p>
                        <p className="text-xs text-muted-foreground">{position}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <LogIn className="w-3 h-3" />
                          {formatTime(log.check_in_at)}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <LogOut className="w-3 h-3" />
                          {formatTime(log.check_out_at)}
                        </div>
                      </div>
                      <StatusBadge
                        status={getStatusBadgeType(log.status)}
                        label={getStatusLabel(log.status)}
                      />
                    </div>
                  </div>
                  {breaks.length > 0 && (
                    <div className="mt-2 ml-[52px] space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Coffee className="w-3 h-3" />
                        <span>휴식 총 {Math.round(totalBreakMin)}분</span>
                      </div>
                      {breaks.map((b: any, i: number) => (
                        <div key={b.id ?? i} className="text-xs text-muted-foreground/70 pl-4">
                          {formatTime(b.start_at)} ~ {b.end_at ? formatTime(b.end_at) : '진행중'}
                          {b.duration_minutes != null && (
                            <span className="ml-1">({Math.round(b.duration_minutes)}분)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendance;
