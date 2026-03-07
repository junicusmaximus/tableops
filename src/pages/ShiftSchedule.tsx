import { useState } from 'react';
import { useWeeklyShifts, useCreateShift, useDeleteShift, useCopyPreviousWeek, Shift } from '@/hooks/useShifts';
import { useStoreEmployees } from '@/hooks/useEmployeeProfile';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useIsManager } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus, Copy, Trash2 } from 'lucide-react';
import { format, addWeeks, subWeeks, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import EmptyState from '@/components/common/EmptyState';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

const ShiftSchedule = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const { data: shifts = [], isLoading } = useWeeklyShifts(currentWeek);
  const { data: profile } = useEmployeeProfile();
  const { data: employees = [] } = useStoreEmployees(profile?.store_id);
  const isManager = useIsManager();
  const createShift = useCreateShift();
  const deleteShift = useDeleteShift();
  const copyWeek = useCopyPreviousWeek();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    user_id: '', shift_date: '', start_time: '09:00', end_time: '18:00', break_minutes: '60', notes: '',
  });

  const weekDates = DAYS.map((_, i) => addDays(weekStart, i));

  const getShiftsForDay = (date: Date) =>
    shifts.filter((s) => s.shift_date === format(date, 'yyyy-MM-dd'));

  const handleCreate = async () => {
    await createShift.mutateAsync({
      user_id: form.user_id,
      shift_date: form.shift_date,
      start_time: form.start_time,
      end_time: form.end_time,
      break_minutes: parseInt(form.break_minutes) || 0,
      notes: form.notes || undefined,
    });
    setDialogOpen(false);
    setForm({ user_id: '', shift_date: '', start_time: '09:00', end_time: '18:00', break_minutes: '60', notes: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">스케줄</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {format(weekStart, 'yyyy년 M월 d일', { locale: ko })} ~ {format(addDays(weekStart, 6), 'M월 d일', { locale: ko })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentWeek(new Date())}>오늘</Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          {isManager && (
            <>
              <Button variant="outline" size="sm" onClick={() => copyWeek.mutate(currentWeek)} disabled={copyWeek.isPending}>
                <Copy className="w-4 h-4 mr-1" />복사
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="w-4 h-4 mr-1" />추가</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>스케줄 추가</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div>
                      <Label>직원</Label>
                      <Select value={form.user_id} onValueChange={(v) => setForm({ ...form, user_id: v })}>
                        <SelectTrigger><SelectValue placeholder="직원 선택" /></SelectTrigger>
                        <SelectContent>
                          {employees.map((e) => (
                            <SelectItem key={e.user_id} value={e.user_id}>{e.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>날짜</Label><Input type="date" value={form.shift_date} onChange={(e) => setForm({ ...form, shift_date: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>시작</Label><Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
                      <div><Label>종료</Label><Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></div>
                    </div>
                    <div><Label>휴식(분)</Label><Input type="number" value={form.break_minutes} onChange={(e) => setForm({ ...form, break_minutes: e.target.value })} /></div>
                    <div><Label>메모</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                    <Button onClick={handleCreate} disabled={!form.user_id || !form.shift_date || createShift.isPending} className="w-full">등록</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDates.map((date, i) => {
          const dayShifts = getShiftsForDay(date);
          const isToday = isSameDay(date, new Date());
          return (
            <Card key={i} className={isToday ? 'ring-2 ring-primary' : ''}>
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className={isToday ? 'text-primary font-bold' : ''}>{DAYS[i]}</span>
                  <span className="text-xs text-muted-foreground">{format(date, 'M/d')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-2">
                {dayShifts.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">없음</p>
                ) : (
                  dayShifts.map((s) => (
                    <div key={s.id} className="bg-muted rounded-lg p-2 text-xs space-y-1 group relative">
                      <p className="font-medium">{s.employee_name}</p>
                      <p className="text-muted-foreground">{s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}</p>
                      {s.notes && <p className="text-muted-foreground truncate">{s.notes}</p>}
                      {isManager && (
                        <button
                          onClick={() => deleteShift.mutate(s.id)}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ShiftSchedule;
