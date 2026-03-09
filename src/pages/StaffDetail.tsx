import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useIsManager, ROLE_LABELS, type AppRole } from '@/hooks/useUserRole';
import { INVITE_STATUS_LABELS, EMPLOYEE_STATUS_LABELS } from '@/hooks/useStaff';
import RoleBadge from '@/components/common/RoleBadge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, Phone, Briefcase, CalendarDays, Clock, CheckCircle2,
  XCircle, ShieldAlert, User, Link2, Link2Off, Palmtree
} from 'lucide-react';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { ko } from 'date-fns/locale';

const EMPLOYMENT_TYPES: Record<string, string> = {
  full_time: '정규직',
  part_time: '파트타임',
  contract: '계약직',
};

const useStaffDetail = (id: string | undefined) => {
  const { data: profile } = useEmployeeProfile();

  return useQuery({
    queryKey: ['staff-detail', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;

      // Fetch role if linked
      let role: string | null = null;
      if (data.user_id) {
        const { data: roles } = await supabase
          .from('user_store_roles')
          .select('role')
          .eq('user_id', data.user_id)
          .eq('store_id', data.store_id)
          .single();
        role = roles?.role ?? data.position;
      } else {
        role = data.position;
      }

      return { ...data, role };
    },
    enabled: !!id && !!profile,
  });
};

const useStaffAttendance = (userId: string | null, storeId: string | undefined) => {
  return useQuery({
    queryKey: ['staff-attendance', userId, storeId],
    queryFn: async () => {
      if (!userId || !storeId) return [];
      const { data, error } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('store_id', storeId)
        .order('date', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId && !!storeId,
  });
};

const useStaffShifts = (userId: string | null, storeId: string | undefined) => {
  return useQuery({
    queryKey: ['staff-shifts', userId, storeId],
    queryFn: async () => {
      if (!userId || !storeId) return [];
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('user_id', userId)
        .eq('store_id', storeId)
        .order('shift_date', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId && !!storeId,
  });
};

const LEAVE_TYPE_LABELS: Record<string, string> = {
  '연차': '연차', '반차': '반차', '병가': '병가', '경조사': '경조사', '기타': '기타',
};

const LEAVE_STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: '대기', variant: 'outline' },
  approved: { label: '승인', variant: 'default' },
  rejected: { label: '반려', variant: 'destructive' },
};

const DEFAULT_ANNUAL_LEAVE = 15;

const useStaffLeave = (userId: string | null, storeId: string | undefined) => {
  return useQuery({
    queryKey: ['staff-leave', userId, storeId],
    queryFn: async () => {
      if (!userId || !storeId) return [];
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('applicant_user_id', userId)
        .eq('store_id', storeId)
        .order('start_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId && !!storeId,
  });
};

const InviteStatusDisplay = ({ status }: { status: string }) => {
  const label = INVITE_STATUS_LABELS[status] ?? status;
  if (status === 'pending') {
    return (
      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
        <Clock className="w-4 h-4" />
        <span className="font-medium">{label}</span>
      </div>
    );
  }
  if (status === 'linked') {
    return (
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="w-4 h-4" />
        <span className="font-medium">{label}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <XCircle className="w-4 h-4" />
      <span className="font-medium">{label}</span>
    </div>
  );
};

const formatDate = (d: string | null) => {
  if (!d) return '-';
  try {
    return format(parseISO(d), 'yyyy년 M월 d일', { locale: ko });
  } catch {
    return d;
  }
};

const formatTime = (t: string | null) => {
  if (!t) return '-';
  try {
    return format(parseISO(t), 'HH:mm');
  } catch {
    return t;
  }
};

const StaffDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isManager = useIsManager();
  const { data: staff, isLoading } = useStaffDetail(id);
  const { data: attendance = [] } = useStaffAttendance(staff?.user_id ?? null, staff?.store_id);
  const { data: shifts = [] } = useStaffShifts(staff?.user_id ?? null, staff?.store_id);
  const { data: leaveRequests = [] } = useStaffLeave(staff?.user_id ?? null, staff?.store_id);

  const currentYear = new Date().getFullYear();
  const thisYearLeaves = leaveRequests.filter(l => l.status === 'approved' && l.start_date.startsWith(String(currentYear)));
  const usedLeaveDays = thisYearLeaves.reduce((sum, l) => {
    const days = differenceInCalendarDays(parseISO(l.end_date), parseISO(l.start_date)) + 1;
    return sum + (l.leave_type === '반차' ? 0.5 : days);
  }, 0);
  const remainingLeave = DEFAULT_ANNUAL_LEAVE - usedLeaveDays;

  if (!isManager) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <ShieldAlert className="w-16 h-16 text-muted-foreground/40 mb-4" />
        <p className="text-lg font-medium text-foreground">관리자 직급 이상부터 사용 가능한 영역입니다.</p>
        <p className="text-sm text-muted-foreground mt-2">대표, 사장님, 매니저 권한이 필요합니다.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <User className="w-16 h-16 text-muted-foreground/40 mb-4" />
        <p className="text-lg font-medium text-foreground">직원 정보를 찾을 수 없습니다.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/staff')}>
          <ArrowLeft className="w-4 h-4 mr-2" />목록으로
        </Button>
      </div>
    );
  }

  const isPending = staff.invite_status === 'pending';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/staff')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">직원 상세</h1>
          <p className="text-sm text-muted-foreground">{staff.full_name}의 프로필 및 근무 이력</p>
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={staff.profile_image_url ?? undefined} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {staff.full_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4 w-full">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold">{staff.full_name}</h2>
                <RoleBadge role={staff.role} />
                {isPending && (
                  <Badge variant="outline" className="text-[11px] border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800">
                    <Clock className="w-3 h-3 mr-1" />초대 대기
                  </Badge>
                )}
              </div>

              {isPending && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <Link2Off className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div className="text-sm text-amber-700 dark:text-amber-300">
                    <p className="font-medium">아직 사용자 계정이 연결되지 않았습니다</p>
                    <p className="text-amber-600/80 dark:text-amber-400/80 mt-0.5">가입 후 전화번호 매칭을 통해 자동 연결 예정입니다.</p>
                  </div>
                </div>
              )}

              {!isPending && staff.linked_at && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <Link2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    계정 연결 완료 · {formatDate(staff.linked_at)}
                  </p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>{staff.phone ?? '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="w-4 h-4 shrink-0" />
                  <span>{EMPLOYMENT_TYPES[staff.employment_type ?? ''] ?? '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="w-4 h-4 shrink-0" />
                  <span>입사일: {formatDate(staff.hire_date)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">초대 상태: </span>
                  <InviteStatusDisplay status={staff.invite_status ?? 'linked'} />
                </div>
                <div>
                  <span className="text-muted-foreground">직원 상태: </span>
                  <span className="font-medium">{EMPLOYEE_STATUS_LABELS[staff.status] ?? staff.status}</span>
                </div>
              </div>

              {staff.bio && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">자기소개</p>
                  <p className="text-sm">{staff.bio}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work history - only for linked employees */}
      {!isPending && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Attendance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />
                최근 출퇴근 기록
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {attendance.length === 0 ? (
                <p className="text-sm text-muted-foreground p-6 text-center">출퇴근 기록이 없습니다.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>날짜</TableHead>
                        <TableHead>출근</TableHead>
                        <TableHead>퇴근</TableHead>
                        <TableHead>근무시간</TableHead>
                        <TableHead>상태</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendance.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="text-xs">{formatDate(a.date)}</TableCell>
                          <TableCell className="text-xs">{formatTime(a.check_in_at)}</TableCell>
                          <TableCell className="text-xs">{formatTime(a.check_out_at)}</TableCell>
                          <TableCell className="text-xs">{a.work_hours ? `${Number(a.work_hours).toFixed(1)}h` : '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {a.is_late && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">지각</Badge>}
                              {a.is_early_leave && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-600">조퇴</Badge>}
                              {!a.is_late && !a.is_early_leave && <span className="text-[10px] text-muted-foreground">정상</span>}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Shifts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                최근 배정 스케줄
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {shifts.length === 0 ? (
                <p className="text-sm text-muted-foreground p-6 text-center">배정된 스케줄이 없습니다.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>날짜</TableHead>
                        <TableHead>시작</TableHead>
                        <TableHead>종료</TableHead>
                        <TableHead>역할</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shifts.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="text-xs">{formatDate(s.shift_date)}</TableCell>
                          <TableCell className="text-xs">{s.start_time}</TableCell>
                          <TableCell className="text-xs">{s.end_time}</TableCell>
                          <TableCell>
                            <RoleBadge role={s.role} className="text-[10px]" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StaffDetail;
