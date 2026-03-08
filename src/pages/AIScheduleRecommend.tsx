import { useState } from 'react';
import { useEmployeeProfile, useStoreEmployees } from '@/hooks/useEmployeeProfile';
import { useIsManager } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Brain, Calendar, AlertTriangle, CheckCircle, Users, Clock,
  ChevronRight, Loader2, Sparkles, RefreshCw, Save, ArrowLeft,
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, addWeeks, eachDayOfInterval } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useCreateShift } from '@/hooks/useShifts';

interface ScheduleShift {
  user_id: string;
  name: string;
  role: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
}

interface DaySchedule {
  date: string;
  shifts: ScheduleShift[];
  warnings?: string[];
}

interface EmployeeSummary {
  user_id: string;
  name: string;
  total_shifts: number;
  total_hours: number;
  role: string;
}

interface Recommendation {
  summary: {
    total_shifts: number;
    period: string;
    warnings: string[];
    shortage_dates: string[];
    leave_reflected: boolean;
  };
  schedule: DaySchedule[];
  employee_summary: EmployeeSummary[];
}

type Step = 'settings' | 'loading' | 'result';

const AIScheduleRecommend = () => {
  const { data: profile } = useEmployeeProfile();
  const isManager = useIsManager();
  const createShift = useCreateShift();

  const [step, setStep] = useState<Step>('settings');
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [selectedShifts, setSelectedShifts] = useState<Record<string, boolean>>({});
  const [applying, setApplying] = useState(false);

  // Settings
  const today = new Date();
  const [periodType, setPeriodType] = useState('next_week');
  const [customStart, setCustomStart] = useState(format(today, 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState(format(addDays(today, 6), 'yyyy-MM-dd'));
  const [hallCount, setHallCount] = useState(2);
  const [kitchenCount, setKitchenCount] = useState(2);
  const [considerPeak, setConsiderPeak] = useState(true);
  const [reflectLeave, setReflectLeave] = useState(true);
  const [includeParttime, setIncludeParttime] = useState(true);
  const [maxHoursLimit, setMaxHoursLimit] = useState(true);

  if (!isManager) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-lg font-semibold">관리자 직급 이상부터 사용 가능한 영역입니다</p>
      </div>
    );
  }

  const getDateRange = () => {
    const now = new Date();
    switch (periodType) {
      case 'today':
        return { start: format(now, 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') };
      case 'this_week':
        return { start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'), end: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd') };
      case 'next_week': {
        const nextWeekStart = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
        return { start: format(nextWeekStart, 'yyyy-MM-dd'), end: format(endOfWeek(nextWeekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd') };
      }
      case 'custom':
        return { start: customStart, end: customEnd };
      default:
        return { start: format(now, 'yyyy-MM-dd'), end: format(addDays(now, 6), 'yyyy-MM-dd') };
    }
  };

  const handleGenerate = async () => {
    if (!profile?.store_id) {
      toast.error('매장 정보를 불러올 수 없습니다');
      return;
    }

    setStep('loading');

    try {
      const { start, end } = getDateRange();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-schedule-recommend`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            store_id: profile.store_id,
            start_date: start,
            end_date: end,
            roles_needed: { hall: hallCount, kitchen: kitchenCount },
            consider_peak: considerPeak,
            reflect_leave: reflectLeave,
            include_parttime: includeParttime,
            max_hours_limit: maxHoursLimit,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed');
      }

      const data: Recommendation = await response.json();
      setRecommendation(data);

      // Select all shifts by default
      const allSelected: Record<string, boolean> = {};
      data.schedule.forEach((day) => {
        day.shifts.forEach((_, i) => {
          allSelected[`${day.date}-${i}`] = true;
        });
      });
      setSelectedShifts(allSelected);
      setStep('result');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'AI 추천 생성에 실패했습니다');
      setStep('settings');
    }
  };

  const handleApply = async () => {
    if (!recommendation || !profile?.store_id) return;
    setApplying(true);

    try {
      let applied = 0;
      for (const day of recommendation.schedule) {
        for (let i = 0; i < day.shifts.length; i++) {
          const key = `${day.date}-${i}`;
          if (!selectedShifts[key]) continue;

          const shift = day.shifts[i];
          await createShift.mutateAsync({
            store_id: profile.store_id,
            shift_date: day.date,
            user_id: shift.user_id,
            start_time: shift.start_time,
            end_time: shift.end_time,
            break_minutes: shift.break_minutes || 0,
            role: shift.role,
            notes: 'AI 추천',
            assignee_type: 'registered_user',
          });
          applied++;
        }
      }
      toast.success(`${applied}건의 스케줄이 적용되었습니다`);
      setStep('settings');
      setRecommendation(null);
    } catch (err) {
      toast.error('스케줄 적용 중 오류가 발생했습니다');
    } finally {
      setApplying(false);
    }
  };

  const toggleShift = (key: string) => {
    setSelectedShifts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectedCount = Object.values(selectedShifts).filter(Boolean).length;
  const totalCount = Object.keys(selectedShifts).length;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        {step !== 'settings' && (
          <Button variant="ghost" size="icon" onClick={() => setStep('settings')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            자동 스케줄 추천
          </h1>
          <p className="text-sm text-muted-foreground mt-1">AI가 매장 데이터를 분석하여 최적의 근무 스케줄을 추천합니다</p>
        </div>
      </div>

      {/* Step 1: Settings */}
      {step === 'settings' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                추천 기간
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'today', label: '오늘' },
                  { value: 'this_week', label: '이번 주' },
                  { value: 'next_week', label: '다음 주' },
                  { value: 'custom', label: '사용자 지정' },
                ].map((opt) => (
                  <Button
                    key={opt.value}
                    variant={periodType === opt.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPeriodType(opt.value)}
                    className="w-full"
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              {periodType === 'custom' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">시작일</Label>
                    <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="h-9" />
                  </div>
                  <div>
                    <Label className="text-xs">종료일</Label>
                    <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="h-9" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                직무별 필요 인원
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>홀</Label>
                <Input type="number" min={0} max={20} value={hallCount} onChange={(e) => setHallCount(Number(e.target.value))} className="w-20 h-9" />
              </div>
              <div className="flex items-center justify-between">
                <Label>주방</Label>
                <Input type="number" min={0} max={20} value={kitchenCount} onChange={(e) => setKitchenCount(Number(e.target.value))} className="w-20 h-9" />
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">추천 옵션</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {[
                { label: '피크 시간대 고려', desc: '매출 데이터 기반 바쁜 시간대 반영', value: considerPeak, onChange: setConsiderPeak },
                { label: '휴가/부재 반영', desc: '승인된 휴가 자동 제외', value: reflectLeave, onChange: setReflectLeave },
                { label: '파트타이머 포함', desc: '파트타임 직원도 추천에 포함', value: includeParttime, onChange: setIncludeParttime },
                { label: '최대 근무시간 제한', desc: '주 40시간 초과 방지', value: maxHoursLimit, onChange: setMaxHoursLimit },
              ].map((opt) => (
                <div key={opt.label} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                  <Switch checked={opt.value} onCheckedChange={opt.onChange} />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="md:col-span-2">
            <Button size="lg" className="w-full" onClick={handleGenerate}>
              <Brain className="w-5 h-5 mr-2" />
              AI 스케줄 추천 생성
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Loading */}
      {step === 'loading' && (
        <Card className="py-16">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Brain className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <Loader2 className="w-6 h-6 text-primary animate-spin absolute -top-1 -right-1" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI가 스케줄을 분석 중입니다</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              직원 정보, 근무 기록, 휴가, 매출 데이터를 분석하여 최적의 스케줄을 생성하고 있습니다...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Result */}
      {step === 'result' && recommendation && (
        <div className="space-y-4">
          {/* Summary */}
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                추천 요약
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-primary">{recommendation.summary.total_shifts}</p>
                  <p className="text-xs text-muted-foreground">총 추천 스케줄</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{recommendation.schedule.length}</p>
                  <p className="text-xs text-muted-foreground">추천 일수</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{recommendation.employee_summary.length}</p>
                  <p className="text-xs text-muted-foreground">배정 인원</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <Badge variant={recommendation.summary.leave_reflected ? 'default' : 'secondary'}>
                    {recommendation.summary.leave_reflected ? '휴가 반영됨' : '휴가 미반영'}
                  </Badge>
                </div>
              </div>

              {/* Warnings */}
              {recommendation.summary.warnings.length > 0 && (
                <div className="mt-4 space-y-2">
                  {recommendation.summary.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded bg-destructive/10 text-destructive text-sm">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      {w}
                    </div>
                  ))}
                </div>
              )}

              {recommendation.summary.shortage_dates.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">인원 부족 예상 일자:</p>
                  <div className="flex flex-wrap gap-1">
                    {recommendation.summary.shortage_dates.map((d) => (
                      <Badge key={d} variant="destructive" className="text-xs">{d}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs: Daily / Employee */}
          <Tabs defaultValue="daily">
            <TabsList className="w-full">
              <TabsTrigger value="daily" className="flex-1">일자별 추천</TabsTrigger>
              <TabsTrigger value="employee" className="flex-1">직원별 요약</TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-3 mt-3">
              {recommendation.schedule.map((day) => (
                <Card key={day.date}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>{format(new Date(day.date), 'M월 d일 (EEEE)', { locale: ko })}</span>
                      <Badge variant="outline" className="text-xs">{day.shifts.length}명 배정</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {day.warnings && day.warnings.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {day.warnings.map((w, i) => (
                          <p key={i} className="text-xs text-destructive flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {w}
                          </p>
                        ))}
                      </div>
                    )}
                    {day.shifts.map((shift, i) => {
                      const key = `${day.date}-${i}`;
                      const isSelected = selectedShifts[key];
                      return (
                        <div
                          key={key}
                          onClick={() => toggleShift(key)}
                          className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-primary/40 bg-primary/5'
                              : 'border-border/50 bg-muted/20 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                              {isSelected && <CheckCircle className="w-3.5 h-3.5 text-primary-foreground" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{shift.name}</p>
                              <p className="text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-[10px] mr-1">{shift.role}</Badge>
                                {shift.start_time} ~ {shift.end_time}
                                {shift.break_minutes > 0 && ` (휴게 ${shift.break_minutes}분)`}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-[10px] border-dashed border border-primary/30">
                            추천 초안
                          </Badge>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="employee" className="mt-3">
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    {recommendation.employee_summary.map((emp) => (
                      <div key={emp.user_id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div>
                          <p className="text-sm font-medium">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-[10px] mr-1">{emp.role}</Badge>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{emp.total_shifts}일 · {emp.total_hours}시간</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action bar */}
          <Card className="sticky bottom-4 border-primary/20 shadow-lg">
            <CardContent className="py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {selectedCount}/{totalCount}건 선택됨
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setStep('settings'); setRecommendation(null); }}>
                    <RefreshCw className="w-4 h-4 mr-1" /> 다시 추천
                  </Button>
                  <Button onClick={handleApply} disabled={applying || selectedCount === 0}>
                    {applying ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                    선택 항목 적용 ({selectedCount}건)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AIScheduleRecommend;
