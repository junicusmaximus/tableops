import { useState, useMemo } from 'react';
import { useMonthlyShifts, Shift } from '@/hooks/useShifts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import EmptyState from '@/components/common/EmptyState';

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

const MySchedule = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data: shifts = [], isLoading } = useMonthlyShifts(currentMonth, { userOnly: true });

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const shiftsByDate = useMemo(() => {
    const map = new Map<string, Shift[]>();
    shifts.forEach((s) => {
      const key = s.shift_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return map;
  }, [shifts]);

  const selectedShifts = selectedDate
    ? shiftsByDate.get(format(selectedDate, 'yyyy-MM-dd')) ?? []
    : [];

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setSheetOpen(true);
  };

  const thisMonthShiftCount = shifts.length;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">내 스케줄</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {format(currentMonth, 'yyyy년 M월', { locale: ko })} · 이번 달 근무 {thisMonthShiftCount}건
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>오늘</Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-3">
          {/* Weekday header */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
            ))}
          </div>
          {/* Days grid */}
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
                          {s.start_time?.slice(0, 5)}-{s.end_time?.slice(0, 5)}
                        </div>
                      ))}
                      {dayShifts.length > 2 && (
                        <span className="text-[10px] text-muted-foreground">+{dayShifts.length - 2}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {selectedDate ? format(selectedDate, 'yyyy년 M월 d일 (EEEE)', { locale: ko }) : ''}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {selectedShifts.length === 0 ? (
              <div className="text-center py-12">
                <CalIcon className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">등록된 스케줄이 없습니다</p>
              </div>
            ) : (
              selectedShifts.map((s) => (
                <Card key={s.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}</span>
                      {s.break_minutes > 0 && (
                        <Badge variant="secondary" className="text-xs">휴게 {s.break_minutes}분</Badge>
                      )}
                    </div>
                    {s.role && <p className="text-xs text-muted-foreground">직무: {s.role}</p>}
                    {s.notes && <p className="text-xs text-muted-foreground">메모: {s.notes}</p>}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MySchedule;
