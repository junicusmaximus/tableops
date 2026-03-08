import { useState, useMemo } from 'react';
import { useMonthlyShifts, useCreateShift, useUpdateShift, useDeleteShift, Shift } from '@/hooks/useShifts';
import { useStoreEmployees, useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useIsManager, getRoleLabel } from '@/hooks/useUserRole';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit2, Calendar as CalIcon, Users } from 'lucide-react';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { Navigate } from 'react-router-dom';

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

const emptyForm = {
  user_id: '', shift_date: '', start_time: '09:00', end_time: '18:00', break_minutes: '60', role: '', notes: '',
};

const ScheduleManagement = () => {
  const isManager = useIsManager();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterEmployee, setFilterEmployee] = useState<string>('all');

  const { data: profile } = useEmployeeProfile();
  const { data: shifts = [] } = useMonthlyShifts(currentMonth);
  const { data: employees = [] } = useStoreEmployees(profile?.store_id);
  const createShift = useCreateShift();
  const updateShift = useUpdateShift();
  const deleteShift = useDeleteShift();

  if (!isManager) {
    return <Navigate to="/schedule" replace />;
  }

  const filteredShifts = filterEmployee === 'all'
    ? shifts
    : shifts.filter((s) => s.user_id === filterEmployee);

  const calendarDays = (() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  })();

  const shiftsByDate = useMemo(() => {
    const map = new Map<string, Shift[]>();
    filteredShifts.forEach((s) => {
      const key = s.shift_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return map;
  }, [filteredShifts]);

  const selectedShifts = selectedDate
    ? shiftsByDate.get(format(selectedDate, 'yyyy-MM-dd')) ?? []
    : [];

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setSheetOpen(true);
  };

  const openCreateDialog = (date?: Date) => {
    setEditingShift(null);
    setForm({
      ...emptyForm,
      shift_date: date ? format(date, 'yyyy-MM-dd') : '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (shift: Shift) => {
    setEditingShift(shift);
    setForm({
      user_id: shift.user_id,
      shift_date: shift.shift_date,
      start_time: shift.start_time?.slice(0, 5) ?? '09:00',
      end_time: shift.end_time?.slice(0, 5) ?? '18:00',
      break_minutes: String(shift.break_minutes ?? 60),
      role: shift.role ?? '',
      notes: shift.notes ?? '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editingShift) {
      await updateShift.mutateAsync({
        id: editingShift.id,
        user_id: form.user_id,
        shift_date: form.shift_date,
        start_time: form.start_time,
        end_time: form.end_time,
        break_minutes: parseInt(form.break_minutes) || 0,
        role: form.role || undefined,
        notes: form.notes || undefined,
      });
    } else {
      await createShift.mutateAsync({
        user_id: form.user_id,
        shift_date: form.shift_date,
        start_time: form.start_time,
        end_time: form.end_time,
        break_minutes: parseInt(form.break_minutes) || 0,
        role: form.role || undefined,
        notes: form.notes || undefined,
      });
    }
    setDialogOpen(false);
    setForm(emptyForm);
  };

  const isPending = createShift.isPending || updateShift.isPending;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">스케줄 관리</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {format(currentMonth, 'yyyy년 M월', { locale: ko })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filterEmployee} onValueChange={setFilterEmployee}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="전체 직원" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 직원</SelectItem>
              {employees.map((e) => (
                <SelectItem key={e.user_id} value={e.user_id}>{e.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>오늘</Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={() => openCreateDialog()}>
            <Plus className="w-4 h-4 mr-1" />등록
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayShifts = shiftsByDate.get(dateStr) ?? [];
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              const selected = selectedDate && isSameDay(day, selectedDate);

              return (
                <button
                  key={dateStr}
                  onClick={() => handleDayClick(day)}
                  className={`
                    relative p-1 min-h-[72px] md:min-h-[88px] border border-border/30 text-left transition-colors
                    ${!inMonth ? 'opacity-30' : 'hover:bg-accent/30'}
                    ${today ? 'bg-primary/5' : ''}
                    ${selected ? 'ring-2 ring-primary' : ''}
                  `}
                >
                  <span className={`text-xs font-medium ${today ? 'text-primary font-bold' : 'text-foreground'}`}>
                    {format(day, 'd')}
                  </span>
                  {dayShifts.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {dayShifts.slice(0, 2).map((s) => (
                        <div key={s.id} className="bg-primary/10 text-primary rounded px-1 py-0.5 text-[10px] truncate leading-tight">
                          {s.employee_name} {s.start_time?.slice(0, 5)}
                        </div>
                      ))}
                      {dayShifts.length > 2 && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Users className="w-3 h-3" />+{dayShifts.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day detail sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span>{selectedDate ? format(selectedDate, 'M월 d일 (EEEE)', { locale: ko }) : ''}</span>
              <Button size="sm" variant="outline" onClick={() => { setSheetOpen(false); openCreateDialog(selectedDate ?? undefined); }}>
                <Plus className="w-4 h-4 mr-1" />추가
              </Button>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {selectedShifts.length === 0 ? (
              <div className="text-center py-12">
                <CalIcon className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">등록된 스케줄이 없습니다</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => { setSheetOpen(false); openCreateDialog(selectedDate ?? undefined); }}>
                  스케줄 등록
                </Button>
              </div>
            ) : (
              selectedShifts.map((s) => (
                <Card key={s.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{s.employee_name}</span>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setSheetOpen(false); openEditDialog(s); }}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteShift.mutate(s.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}
                      {s.break_minutes > 0 && ` (휴게 ${s.break_minutes}분)`}
                    </p>
                    {s.role && <Badge variant="secondary" className="text-xs">{s.role}</Badge>}
                    {s.notes && <p className="text-xs text-muted-foreground">{s.notes}</p>}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingShift ? '스케줄 수정' : '스케줄 등록'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>직원</Label>
              <Select value={form.user_id} onValueChange={(v) => setForm({ ...form, user_id: v })}>
                <SelectTrigger><SelectValue placeholder="직원 선택" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.user_id} value={e.user_id}>{e.full_name} {e.position ? `(${e.position})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>날짜</Label><Input type="date" value={form.shift_date} onChange={(e) => setForm({ ...form, shift_date: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>시작</Label><Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
              <div><Label>종료</Label><Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>휴게(분)</Label><Input type="number" value={form.break_minutes} onChange={(e) => setForm({ ...form, break_minutes: e.target.value })} /></div>
              <div><Label>직무</Label><Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="홀, 주방 등" /></div>
            </div>
            <div><Label>메모</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button onClick={handleSubmit} disabled={!form.user_id || !form.shift_date || isPending}>
              {isPending ? '처리 중...' : editingShift ? '수정' : '등록'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScheduleManagement;
