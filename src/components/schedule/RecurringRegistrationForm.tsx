import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCreateShift, useDeleteConflictingShifts } from '@/hooks/useShifts';
import { useStoreEmployees } from '@/hooks/useEmployeeProfile';
import { useToast } from '@/hooks/use-toast';
import ShiftTemplateSelector from './ShiftTemplateSelector';
import type { ShiftTemplate } from '@/hooks/useShiftTemplates';
import { format, eachDayOfInterval, parseISO, getDay } from 'date-fns';
import { AlertTriangle, Repeat, Users } from 'lucide-react';

const WEEKDAY_OPTIONS = [
  { value: 1, label: '월' },
  { value: 2, label: '화' },
  { value: 3, label: '수' },
  { value: 4, label: '목' },
  { value: 5, label: '금' },
  { value: 6, label: '토' },
  { value: 0, label: '일' },
];

interface Props {
  storeId: string | undefined;
  existingShifts: Array<{ user_id: string | null; shift_date: string; start_time: string }>;
  onDone: () => void;
}

export default function RecurringRegistrationForm({ storeId, existingShifts, onDone }: Props) {
  const { data: employees = [] } = useStoreEmployees(storeId);
  const createShift = useCreateShift();
  const { toast } = useToast();

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [breakMinutes, setBreakMinutes] = useState('60');
  const [role, setRole] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const toggleUser = (uid: string) => {
    setSelectedUserIds((prev) => prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]);
  };

  const toggleWeekday = (day: number) => {
    setSelectedWeekdays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  const matchingDates = useMemo(() => {
    if (!dateStart || !dateEnd || selectedWeekdays.length === 0) return [];
    return eachDayOfInterval({ start: parseISO(dateStart), end: parseISO(dateEnd) })
      .filter((d) => selectedWeekdays.includes(getDay(d)))
      .map((d) => format(d, 'yyyy-MM-dd'));
  }, [dateStart, dateEnd, selectedWeekdays]);

  const totalEntries = selectedUserIds.length * matchingDates.length;

  const conflicts = matchingDates.flatMap((date) =>
    selectedUserIds.filter((uid) =>
      existingShifts.some((s) => s.user_id === uid && s.shift_date === date && s.start_time?.slice(0, 5) === startTime)
    ).map((uid) => ({ uid, date }))
  );

  const handleTemplateSelect = (t: ShiftTemplate) => {
    setStartTime(t.start_time?.slice(0, 5) ?? '09:00');
    setEndTime(t.end_time?.slice(0, 5) ?? '18:00');
    setBreakMinutes(String(t.break_minutes));
    if (t.role) setRole(t.role);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      for (const date of matchingDates) {
        for (const uid of selectedUserIds) {
          await createShift.mutateAsync({
            user_id: uid,
            shift_date: date,
            start_time: startTime,
            end_time: endTime,
            break_minutes: parseInt(breakMinutes) || 0,
            role: role || null,
            notes: notes || null,
            assignee_type: 'registered_user',
          });
        }
      }
      toast({ title: `${totalEntries}건 반복 스케줄 등록 완료` });
      onDone();
    } catch (e: any) {
      toast({ title: '등록 실패', description: e.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  };

  const isValid = selectedUserIds.length > 0 && matchingDates.length > 0;

  return (
    <div className="space-y-4">
      {/* Employee multi-select */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="flex items-center gap-1"><Users className="w-4 h-4" />직원 선택</Label>
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => {
            setSelectedUserIds(selectedUserIds.length === employees.length ? [] : employees.map((e) => e.user_id));
          }}>
            {selectedUserIds.length === employees.length ? '전체 해제' : '전체 선택'}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto border rounded-md p-2">
          {employees.map((e) => (
            <label key={e.user_id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent/30 rounded px-1 py-0.5">
              <Checkbox checked={selectedUserIds.includes(e.user_id)} onCheckedChange={() => toggleUser(e.user_id)} />
              <span className="truncate">{e.full_name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Date range */}
      <div className="grid grid-cols-2 gap-3">
        <div><Label>시작일</Label><Input type="date" value={dateStart} onChange={(e) => { setDateStart(e.target.value); if (!dateEnd) setDateEnd(e.target.value); }} /></div>
        <div><Label>종료일</Label><Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} min={dateStart} /></div>
      </div>

      {/* Weekday selector */}
      <div>
        <Label className="flex items-center gap-1 mb-2"><Repeat className="w-3 h-3" />반복 요일</Label>
        <div className="flex gap-1.5">
          {WEEKDAY_OPTIONS.map((wd) => (
            <button
              key={wd.value}
              type="button"
              onClick={() => toggleWeekday(wd.value)}
              className={`w-9 h-9 rounded-full text-sm font-medium transition-colors border
                ${selectedWeekdays.includes(wd.value) 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-background text-foreground border-border hover:bg-accent'}`}
            >
              {wd.label}
            </button>
          ))}
        </div>
      </div>

      {/* Template */}
      <ShiftTemplateSelector onSelect={handleTemplateSelect} currentValues={{ start_time: startTime, end_time: endTime, break_minutes: breakMinutes, role }} />

      {/* Time */}
      <div className="grid grid-cols-2 gap-3">
        <div><Label>시작</Label><Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></div>
        <div><Label>종료</Label><Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>휴게(분)</Label><Input type="number" value={breakMinutes} onChange={(e) => setBreakMinutes(e.target.value)} /></div>
        <div><Label>직무</Label><Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="홀, 주방 등" /></div>
      </div>
      <div><Label>메모</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></div>

      {/* Summary */}
      {isValid && (
        <Card className="bg-muted/50">
          <CardContent className="p-3 space-y-1">
            <p className="text-sm font-medium">등록 요약</p>
            <p className="text-xs text-muted-foreground">
              {selectedUserIds.length}명 × {matchingDates.length}일 = <strong className="text-foreground">{totalEntries}건</strong>
            </p>
            <p className="text-xs text-muted-foreground">
              반복: {selectedWeekdays.map(w => WEEKDAY_OPTIONS.find(o => o.value === w)?.label).join(', ')}요일
            </p>
            <p className="text-xs text-muted-foreground">
              {startTime}~{endTime} / 휴게 {breakMinutes}분{role && ` / ${role}`}
            </p>
            {conflicts.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-destructive mt-1">
                <AlertTriangle className="w-3 h-3" />
                {conflicts.length}건의 중복 스케줄이 감지되었습니다
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onDone}>취소</Button>
        {!showConfirm ? (
          <Button disabled={!isValid} onClick={() => setShowConfirm(true)}>
            {totalEntries}건 등록하기
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting} variant="default">
            {isSubmitting ? '등록 중...' : '확인 - 등록 실행'}
          </Button>
        )}
      </div>
    </div>
  );
}
