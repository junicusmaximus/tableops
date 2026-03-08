import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { Plus, Calendar, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LeaveRecord {
  id: number;
  name: string;
  type: string;
  start: string;
  end: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
}

const initialLeaves: LeaveRecord[] = [
  { id: 1, name: '박서준', type: '연차', start: '2026-03-05', end: '2026-03-05', status: 'pending', reason: '개인 사유' },
  { id: 2, name: '최유나', type: '반차(오전)', start: '2026-03-03', end: '2026-03-03', status: 'approved', reason: '병원 진료' },
  { id: 3, name: '정하늘', type: '연차', start: '2026-03-10', end: '2026-03-11', status: 'pending', reason: '가족 행사' },
  { id: 4, name: '한소영', type: '시간차(2h)', start: '2026-03-04', end: '2026-03-04', status: 'rejected', reason: '은행 업무' },
];

const Leave = () => {
  const { toast } = useToast();
  const [leaves, setLeaves] = useState<LeaveRecord[]>(initialLeaves);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ type: '연차', start: '', end: '', reason: '' });

  const handleApprove = (id: number) => {
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: 'approved' as const } : l));
    toast({ title: '승인 완료', description: '휴가가 승인되었습니다.' });
  };

  const handleReject = (id: number) => {
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: 'rejected' as const } : l));
    toast({ title: '반려 완료', description: '휴가가 반려되었습니다.', variant: 'destructive' });
  };

  const handleSubmit = () => {
    if (!form.start || !form.reason) {
      toast({ title: '입력 오류', description: '시작일과 사유를 입력해주세요.', variant: 'destructive' });
      return;
    }
    const newLeave: LeaveRecord = {
      id: Date.now(),
      name: '나',
      type: form.type,
      start: form.start,
      end: form.end || form.start,
      status: 'pending',
      reason: form.reason,
    };
    setLeaves(prev => [newLeave, ...prev]);
    setDialogOpen(false);
    setForm({ type: '연차', start: '', end: '', reason: '' });
    toast({ title: '신청 완료', description: '휴가 신청이 접수되었습니다.' });
  };

  const pending = leaves.filter(l => l.status === 'pending').length;
  const approved = leaves.filter(l => l.status === 'approved').length;
  const rejected = leaves.filter(l => l.status === 'rejected').length;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">휴가 관리</h1>
          <p className="text-muted-foreground text-sm mt-1">휴가 신청 및 승인 현황</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />휴가 신청</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>휴가 신청</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>휴가 유형</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="연차">연차</SelectItem>
                    <SelectItem value="반차(오전)">반차(오전)</SelectItem>
                    <SelectItem value="반차(오후)">반차(오후)</SelectItem>
                    <SelectItem value="시간차(2h)">시간차(2h)</SelectItem>
                    <SelectItem value="병가">병가</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>시작일 *</Label><Input type="date" value={form.start} onChange={e => setForm({ ...form, start: e.target.value })} /></div>
                <div><Label>종료일</Label><Input type="date" value={form.end} onChange={e => setForm({ ...form, end: e.target.value })} /></div>
              </div>
              <div><Label>사유 *</Label><Textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="휴가 사유를 입력하세요" /></div>
              <Button onClick={handleSubmit} className="w-full">신청하기</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-warning">{pending}</p><p className="text-xs text-muted-foreground">승인 대기</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-success">{approved}</p><p className="text-xs text-muted-foreground">승인 완료</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-destructive">{rejected}</p><p className="text-xs text-muted-foreground">반려</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">휴가 신청 내역</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {leaves.length === 0 ? (
            <EmptyState icon={Briefcase} title="휴가 신청 내역이 없습니다" description="새로운 휴가를 신청해 보세요." />
          ) : leaves.map((leave) => (
            <div key={leave.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">{leave.name.charAt(0)}</div>
                <div>
                  <p className="text-sm font-medium">{leave.name} · {leave.type}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {leave.start}{leave.start !== leave.end ? ` ~ ${leave.end}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">{leave.reason}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge
                  status={leave.status === 'approved' ? 'success' : leave.status === 'rejected' ? 'destructive' : 'warning'}
                  label={leave.status === 'approved' ? '승인' : leave.status === 'rejected' ? '반려' : '대기'}
                />
                {leave.status === 'pending' && (
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => handleApprove(leave.id)}>승인</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleReject(leave.id)}>반려</Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Leave;
