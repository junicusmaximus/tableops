import { useState, useMemo } from 'react';
import { useMonthlyShifts, useCreateShift, useUpdateShift, useDeleteShift, Shift } from '@/hooks/useShifts';
import { useStoreEmployees, useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useIsManager } from '@/hooks/useUserRole';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit2, Calendar as CalIcon, Users, ShieldAlert, UserPlus, Layers, Repeat, Copy } from 'lucide-react';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import ShiftTemplateSelector from '@/components/schedule/ShiftTemplateSelector';
import BulkRegistrationForm from '@/components/schedule/BulkRegistrationForm';
import RecurringRegistrationForm from '@/components/schedule/RecurringRegistrationForm';
import CopyScheduleActions from '@/components/schedule/CopyScheduleActions';
import type { ShiftTemplate } from '@/hooks/useShiftTemplates';

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

const emptyForm = {
  assignee_type: 'registered_user' as 'registered_user' | 'manual_entry',
  user_id: '',
  manual_name: '',
  manual_role_label: '',
  manual_phone: '',
  shift_date: '',
  start_time: '09:00',
  end_time: '18:00',
  break_minutes: '60',
  role: '',
  notes: '',
};

type RegistrationMode = 'single' | 'bulk' | 'recurring';

const ScheduleManagement = () => {
  const { user } = useAuth();
  const isManager = useIsManager();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<RegistrationMode>('single');
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: profile } = useEmployeeProfile();
  const { data: shifts = [] } = useMonthlyShifts(currentMonth);
  const { data: employees = [] } = useStoreEmployees(profile?.store_id);
  const createShift = useCreateShift();
  const updateShift = useUpdateShift();
  const deleteShift = useDeleteShift();

  if (!isManager) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <ShieldAlert className="w-16 h-16 text-muted-foreground/40 mb-4" />
        <p className="text-lg font-medium text-foreground">관리자 직급 이상부터 사용 가능한 영역입니다.</p>
        <p className="text-sm text-muted-foreground mt-2">대표, 사장님, 매니저 권한이 필요합니다.</p>
      </div>
    );
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

  const openCreateDialog = (mode: RegistrationMode = 'single', date?: Date) => {
    setEditingShift(null);
    setDialogMode(mode);
    setForm({
      ...emptyForm,
      shift_date: date ? format(date, 'yyyy-MM-dd') : '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (shift: Shift) => {
    setEditingShift(shift);
    setDialogMode('single');
    const isManual = (shift as any).assignee_type === 'manual_entry';
    setForm({
      assignee_type: isManual ? 'manual_entry' : 'registered_user',
      user_id: shift.user_id ?? '',
      manual_name: (shift as any).manual_name ?? '',
      manual_role_label: (shift as any).manual_role_label ?? '',
      manual_phone: (shift as any).manual_phone ?? '',
      shift_date: shift.shift_date,
      start_time: shift.start_time?.slice(0, 5) ?? '09:00',
      end_time: shift.end_time?.slice(0, 5) ?? '18:00',
      break_minutes: String(shift.break_minutes ?? 60),
      role: shift.role ?? '',
      notes: shift.notes ?? '',
    });
    setDialogOpen(true);
  };

  const handleTemplateSelect = (t: ShiftTemplate) => {
    setForm((prev) => ({
      ...prev,
      start_time: t.start_time?.slice(0, 5) ?? '09:00',
      end_time: t.end_time?.slice(0, 5) ?? '18:00',
      break_minutes: String(t.break_minutes),
      role: t.role ?? prev.role,
    }));
  };

  const handleSubmit = async () => {
    if (form.assignee_type === 'registered_user' && !form.user_id) return;
    if (form.assignee_type === 'manual_entry' && !form.manual_name.trim()) return;
    if (!form.shift_date) return;

    const payload: any = {
      shift_date: form.shift_date,
      start_time: form.start_time,
      end_time: form.end_time,
      break_minutes: parseInt(form.break_minutes) || 0,
      role: form.role || null,
      notes: form.notes || null,
      assignee_type: form.assignee_type,
      user_id: form.assignee_type === 'registered_user' ? form.user_id : null,
      manual_name: form.assignee_type === 'manual_entry' ? form.manual_name : null,
      manual_role_label: form.assignee_type === 'manual_entry' ? form.manual_role_label : null,
      manual_phone: form.assignee_type === 'manual_entry' ? form.manual_phone : null,
    };

    if (editingShift) {
      await updateShift.mutateAsync({ id: editingShift.id, ...payload });
    } else {
      await createShift.mutateAsync(payload);
    }
    setDialogOpen(false);
    setForm(emptyForm);
  };

  const handleDelete = async (id: string) => {
    await deleteShift.mutateAsync(id);
    setDeleteConfirmId(null);
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
    } catch {}
  };

  const isPending = createShift.isPending || updateShift.isPending;

  const getShiftDisplayName = (s: any) => {
    if (s.assignee_type === 'manual_entry') return s.manual_name || '직접 입력';
    return s.employee_name || '미지정';
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
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
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => openCreateDialog('single')}>
          <Plus className="w-4 h-4 mr-1" />등록
        </Button>
        <Button size="sm" variant="secondary" onClick={() => openCreateDialog('bulk')}>
          <Layers className="w-4 h-4 mr-1" />대량 등록
        </Button>
        <Button size="sm" variant="secondary" onClick={() => openCreateDialog('recurring')}>
          <Repeat className="w-4 h-4 mr-1" />반복 등록
        </Button>
        <CopyScheduleActions
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          shiftsForSelectedDate={selectedShifts}
        />
      </div>

      {/* Calendar */}
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
                          {getShiftDisplayName(s)} {s.start_time?.slice(0, 5)}
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
              <Button size="sm" variant="outline" onClick={() => { setSheetOpen(false); openCreateDialog('single', selectedDate ?? undefined); }}>
                <Plus className="w-4 h-4 mr-1" />추가
              </Button>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {selectedShifts.length === 0 ? (
              <div className="text-center py-12">
                <CalIcon className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">등록된 스케줄이 없습니다</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => { setSheetOpen(false); openCreateDialog('single', selectedDate ?? undefined); }}>
                  스케줄 등록
                </Button>
              </div>
            ) : (
              selectedShifts.map((s: any) => (
                <Card key={s.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{getShiftDisplayName(s)}</span>
                        {s.assignee_type === 'manual_entry' && (
                          <Badge variant="outline" className="text-[10px]"><UserPlus className="w-3 h-3 mr-0.5" />직접입력</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" title="복제" onClick={() => handleDuplicateShift(s)}>
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setSheetOpen(false); openEditDialog(s); }}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteConfirmId(s.id)}>
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

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>스케줄 삭제</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">이 스케줄을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>취소</Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} disabled={deleteShift.isPending}>
              {deleteShift.isPending ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registration Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingShift ? '스케줄 수정' : '스케줄 등록'}</DialogTitle>
          </DialogHeader>

          {editingShift ? (
            /* Edit mode - single form only */
            <SingleFormContent
              form={form}
              setForm={setForm}
              employees={employees}
              onTemplateSelect={handleTemplateSelect}
            />
          ) : (
            /* Create mode - tabs */
            <Tabs value={dialogMode} onValueChange={(v) => setDialogMode(v as RegistrationMode)}>
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="single">단일 등록</TabsTrigger>
                <TabsTrigger value="bulk">대량 등록</TabsTrigger>
                <TabsTrigger value="recurring">반복 등록</TabsTrigger>
              </TabsList>

              <TabsContent value="single" className="mt-4">
                <SingleFormContent
                  form={form}
                  setForm={setForm}
                  employees={employees}
                  onTemplateSelect={handleTemplateSelect}
                />
              </TabsContent>

              <TabsContent value="bulk" className="mt-4">
                <BulkRegistrationForm
                  storeId={profile?.store_id}
                  existingShifts={shifts}
                  onDone={() => { setDialogOpen(false); }}
                />
              </TabsContent>

              <TabsContent value="recurring" className="mt-4">
                <RecurringRegistrationForm
                  storeId={profile?.store_id}
                  existingShifts={shifts}
                  onDone={() => { setDialogOpen(false); }}
                />
              </TabsContent>
            </Tabs>
          )}

          {/* Footer only for single mode */}
          {(dialogMode === 'single' || editingShift) && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  isPending ||
                  !form.shift_date ||
                  (form.assignee_type === 'registered_user' && !form.user_id) ||
                  (form.assignee_type === 'manual_entry' && !form.manual_name.trim())
                }
              >
                {isPending ? '처리 중...' : editingShift ? '수정' : '등록'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* Single registration form content (extracted for reuse in edit & create) */
function SingleFormContent({
  form,
  setForm,
  employees,
  onTemplateSelect,
}: {
  form: typeof emptyForm;
  setForm: (f: typeof emptyForm | ((prev: typeof emptyForm) => typeof emptyForm)) => void;
  employees: Array<{ user_id: string; full_name: string; position: string | null }>;
  onTemplateSelect: (t: ShiftTemplate) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Assignee type tabs */}
      <Tabs value={form.assignee_type} onValueChange={(v) => setForm({ ...form, assignee_type: v as any, user_id: '', manual_name: '' })}>
        <TabsList className="w-full">
          <TabsTrigger value="registered_user" className="flex-1">등록된 회원 선택</TabsTrigger>
          <TabsTrigger value="manual_entry" className="flex-1">직접 입력</TabsTrigger>
        </TabsList>
        <TabsContent value="registered_user" className="mt-3">
          <div>
            <Label>직원</Label>
            <Select value={form.user_id} onValueChange={(v) => setForm({ ...form, user_id: v })}>
              <SelectTrigger><SelectValue placeholder="직원 선택" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.user_id} value={e.user_id}>
                    {e.full_name} {e.position ? `(${e.position})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
        <TabsContent value="manual_entry" className="mt-3 space-y-3">
          <div><Label>이름 *</Label><Input value={form.manual_name} onChange={(e) => setForm({ ...form, manual_name: e.target.value })} placeholder="이름을 입력해주세요." /></div>
          <div><Label>직급 / 분류</Label><Input value={form.manual_role_label} onChange={(e) => setForm({ ...form, manual_role_label: e.target.value })} placeholder="예: 파트타이머, 외부 도움" /></div>
          <div><Label>연락처</Label><Input value={form.manual_phone} onChange={(e) => setForm({ ...form, manual_phone: e.target.value })} placeholder="010-0000-0000" /></div>
        </TabsContent>
      </Tabs>

      {/* Template selector */}
      <ShiftTemplateSelector
        onSelect={onTemplateSelect}
        currentValues={{ start_time: form.start_time, end_time: form.end_time, break_minutes: form.break_minutes, role: form.role }}
      />

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
  );
}

export default ScheduleManagement;
