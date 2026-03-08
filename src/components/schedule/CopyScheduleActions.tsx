import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useCopyPreviousWeek, useCreateShift, Shift } from '@/hooks/useShifts';
import { useToast } from '@/hooks/use-toast';
import { Copy, Calendar, ArrowRight } from 'lucide-react';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Props {
  currentMonth: Date;
  selectedDate: Date | null;
  shiftsForSelectedDate: Shift[];
}

export default function CopyScheduleActions({ currentMonth, selectedDate, shiftsForSelectedDate }: Props) {
  const copyPrevWeek = useCopyPreviousWeek();
  const createShift = useCreateShift();
  const { toast } = useToast();
  const [showCopyDay, setShowCopyDay] = useState(false);
  const [targetDates, setTargetDates] = useState<string[]>([]);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [isCopying, setIsCopying] = useState(false);

  const handleCopyPrevWeek = () => {
    copyPrevWeek.mutate(currentMonth);
  };

  const handleDuplicateShift = async (shift: Shift) => {
    try {
      await createShift.mutateAsync({
        user_id: shift.user_id,
        shift_date: shift.shift_date,
        start_time: shift.start_time,
        end_time: shift.end_time,
        break_minutes: shift.break_minutes,
        role: shift.role,
        notes: shift.notes,
        assignee_type: shift.assignee_type ?? 'registered_user',
        manual_name: shift.manual_name,
        manual_role_label: shift.manual_role_label,
        manual_phone: shift.manual_phone,
      });
      toast({ title: '스케줄 복제 완료' });
    } catch (e: any) {
      toast({ title: '복제 실패', description: e.message, variant: 'destructive' });
    }
  };

  const targetDateList = dateStart && dateEnd
    ? eachDayOfInterval({ start: parseISO(dateStart), end: parseISO(dateEnd) }).map(d => format(d, 'yyyy-MM-dd'))
    : [];

  const handleCopyDayToRange = async () => {
    if (!shiftsForSelectedDate.length || targetDateList.length === 0) return;
    setIsCopying(true);
    try {
      for (const targetDate of targetDateList) {
        for (const shift of shiftsForSelectedDate) {
          await createShift.mutateAsync({
            user_id: shift.user_id,
            shift_date: targetDate,
            start_time: shift.start_time,
            end_time: shift.end_time,
            break_minutes: shift.break_minutes,
            role: shift.role,
            notes: shift.notes,
            assignee_type: shift.assignee_type ?? 'registered_user',
            manual_name: shift.manual_name,
            manual_role_label: shift.manual_role_label,
            manual_phone: shift.manual_phone,
          });
        }
      }
      toast({ title: `${shiftsForSelectedDate.length * targetDateList.length}건 스케줄 복사 완료` });
      setShowCopyDay(false);
    } catch (e: any) {
      toast({ title: '복사 실패', description: e.message, variant: 'destructive' });
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleCopyPrevWeek} disabled={copyPrevWeek.isPending}>
          <Copy className="w-3.5 h-3.5 mr-1" />
          {copyPrevWeek.isPending ? '복사 중...' : '지난주 복사'}
        </Button>
        {selectedDate && shiftsForSelectedDate.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setShowCopyDay(true)}>
            <Calendar className="w-3.5 h-3.5 mr-1" />
            이 날 스케줄 복사
          </Button>
        )}
      </div>

      <Dialog open={showCopyDay} onOpenChange={setShowCopyDay}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {selectedDate ? format(selectedDate, 'M월 d일', { locale: ko }) : ''} 스케줄 복사
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {shiftsForSelectedDate.length}건의 스케줄을 선택한 날짜로 복사합니다.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>시작일</Label><Input type="date" value={dateStart} onChange={(e) => { setDateStart(e.target.value); if (!dateEnd) setDateEnd(e.target.value); }} /></div>
              <div><Label>종료일</Label><Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} min={dateStart} /></div>
            </div>
            {targetDateList.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {targetDateList.length}일 × {shiftsForSelectedDate.length}건 = {targetDateList.length * shiftsForSelectedDate.length}건 생성 예정
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCopyDay(false)}>취소</Button>
            <Button onClick={handleCopyDayToRange} disabled={isCopying || targetDateList.length === 0}>
              {isCopying ? '복사 중...' : '복사 실행'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { type Props as CopyScheduleActionsProps };
export { CopyScheduleActions };
