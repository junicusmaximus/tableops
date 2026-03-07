import { useState } from 'react';
import {
  useReservationsByDate, useCreateReservation, useUpdateReservationStatus,
  RESERVATION_STATUSES, Reservation,
} from '@/hooks/useReservations';
import { useIsManager } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Plus, CalendarDays, ChevronLeft, ChevronRight, Users, Star } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import EmptyState from '@/components/common/EmptyState';

const STATUS_COLORS: Record<string, string> = {
  '예약 확정': 'bg-primary/10 text-primary',
  '방문 완료': 'bg-success/10 text-success',
  '노쇼': 'bg-destructive/10 text-destructive',
  '취소': 'bg-muted text-muted-foreground',
  '대기': 'bg-warning/10 text-warning',
};

const Reservations = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { data: reservations = [], isLoading } = useReservationsByDate(selectedDate);
  const createReservation = useCreateReservation();
  const updateStatus = useUpdateReservationStatus();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [form, setForm] = useState({
    customer_name: '', phone_number: '', reservation_date: selectedDate,
    reservation_time: '18:00', guest_count: '2', seating_area: '',
    memo: '', special_request: '', vip_flag: false,
  });

  const filtered = statusFilter === 'all'
    ? reservations
    : reservations.filter((r) => r.status === statusFilter);

  const totalGuests = reservations.reduce((sum, r) => sum + r.guest_count, 0);
  const confirmedCount = reservations.filter((r) => r.status === '예약 확정').length;

  const handleCreate = async () => {
    await createReservation.mutateAsync({
      customer_name: form.customer_name,
      phone_number: form.phone_number || undefined,
      reservation_date: form.reservation_date,
      reservation_time: form.reservation_time,
      guest_count: parseInt(form.guest_count) || 2,
      seating_area: form.seating_area || undefined,
      memo: form.memo || undefined,
      special_request: form.special_request || undefined,
      vip_flag: form.vip_flag,
    });
    setDialogOpen(false);
    setForm({ customer_name: '', phone_number: '', reservation_date: selectedDate, reservation_time: '18:00', guest_count: '2', seating_area: '', memo: '', special_request: '', vip_flag: false });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">예약 관리</h1>
          <p className="text-muted-foreground text-sm mt-1">{format(new Date(selectedDate), 'yyyy년 M월 d일 (EEEE)', { locale: ko })}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />예약 등록</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>새 예약</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>고객명 *</Label><Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} /></div>
              <div><Label>연락처</Label><Input value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} placeholder="010-0000-0000" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>날짜</Label><Input type="date" value={form.reservation_date} onChange={(e) => setForm({ ...form, reservation_date: e.target.value })} /></div>
                <div><Label>시간</Label><Input type="time" value={form.reservation_time} onChange={(e) => setForm({ ...form, reservation_time: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>인원</Label><Input type="number" min="1" value={form.guest_count} onChange={(e) => setForm({ ...form, guest_count: e.target.value })} /></div>
                <div><Label>좌석</Label><Input value={form.seating_area} onChange={(e) => setForm({ ...form, seating_area: e.target.value })} placeholder="창가, 룸 등" /></div>
              </div>
              <div><Label>메모</Label><Textarea value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} rows={2} /></div>
              <div><Label>특이사항</Label><Input value={form.special_request} onChange={(e) => setForm({ ...form, special_request: e.target.value })} placeholder="알레르기, 유아 동반 등" /></div>
              <div className="flex items-center gap-2">
                <Switch checked={form.vip_flag} onCheckedChange={(v) => setForm({ ...form, vip_flag: v })} />
                <Label>VIP 고객</Label>
              </div>
              <Button onClick={handleCreate} disabled={!form.customer_name || createReservation.isPending} className="w-full">등록</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Date navigation + summary */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-auto" />
        <Button variant="outline" size="icon" onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <div className="ml-auto flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">예약 <strong className="text-foreground">{confirmedCount}</strong>건</span>
          <span className="text-muted-foreground">총 <strong className="text-foreground">{totalGuests}</strong>명</span>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button variant={statusFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('all')}>전체</Button>
        {RESERVATION_STATUSES.map((s) => (
          <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)}>{s}</Button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card><CardContent className="p-8"><EmptyState icon={CalendarDays} title="예약이 없습니다" description="예약을 등록해 주세요." /></CardContent></Card>
        ) : (
          filtered.map((r) => (
            <Card key={r.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{r.customer_name}</span>
                      {r.vip_flag && <Star className="w-4 h-4 text-warning fill-warning" />}
                      <Badge className={`text-xs ${STATUS_COLORS[r.status] ?? ''}`}>{r.status}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{r.reservation_time?.slice(0, 5)}</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{r.guest_count}명</span>
                      {r.seating_area && <span>{r.seating_area}</span>}
                    </div>
                    {r.special_request && <p className="text-xs text-accent mt-1">⚠ {r.special_request}</p>}
                    {r.memo && <p className="text-xs text-muted-foreground mt-1">{r.memo}</p>}
                  </div>
                  <Select value={r.status} onValueChange={(v) => updateStatus.mutate({ id: r.id, status: v })}>
                    <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RESERVATION_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Reservations;
