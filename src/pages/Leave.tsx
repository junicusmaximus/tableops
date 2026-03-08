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
import { useAuth } from '@/contexts/AuthContext';
import { useIsManager } from '@/hooks/useUserRole';
import {
  useLeaveRequests,
  useCreateLeaveRequest,
  useApproveLeaveRequest,
  useRejectLeaveRequest,
} from '@/hooks/useLeaveRequests';

const Leave = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isManager = useIsManager();
  const { data: leaves = [], isLoading } = useLeaveRequests();
  const createLeave = useCreateLeaveRequest();
  const approveLeave = useApproveLeaveRequest();
  const rejectLeave = useRejectLeaveRequest();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [form, setForm] = useState({ type: '연차', start: '', end: '', reason: '' });

  const handleApprove = (id: string) => {
    approveLeave.mutate(id, {
      onSuccess: () => toast({ title: '승인 완료', description: '휴가가 승인되었습니다.' }),
      onError: (e) => toast({ title: '오류', description: e.message, variant: 'destructive' }),
    });
  };

  const handleRejectOpen = (id: string) => {
    setRejectingId(id);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!rejectingId) return;
    rejectLeave.mutate(
      { leaveId: rejectingId, rejectionReason: rejectionReason || undefined },
      {
        onSuccess: () => {
          toast({ title: '반려 완료', description: '휴가가 반려되었습니다.', variant: 'destructive' });
          setRejectDialogOpen(false);
          setRejectingId(null);
        },
        onError: (e) => toast({ title: '오류', description: e.message, variant: 'destructive' }),
      }
    );
  };

  const handleSubmit = () => {
    if (!form.start || !form.reason) {
      toast({ title: '입력 오류', description: '시작일과 사유를 입력해주세요.', variant: 'destructive' });
      return;
    }
    createLeave.mutate(
      { leave_type: form.type, start_date: form.start, end_date: form.end || form.start, reason: form.reason },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setForm({ type: '연차', start: '', end: '', reason: '' });
          toast({ title: '신청 완료', description: '휴가 신청이 완료되었습니다.' });
        },
        onError: (e) => toast({ title: '오류', description: e.message, variant: 'destructive' }),
      }
    );
  };

  const pending = leaves.filter(l => l.status === 'pending').length;
  const approved = leaves.filter(l => l.status === 'approved').length;
  const rejected = leaves.filter(l => l.status === 'rejected').length;

  // Non-managers only see own requests
  const visibleLeaves = isManager ? leaves : leaves.filter(l => l.applicant_user_id === user?.id);

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
              <Button onClick={handleSubmit} className="w-full" disabled={createLeave.isPending}>
                {createLeave.isPending ? '신청 중...' : '신청하기'}
              </Button>
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
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">로딩 중...</p>
          ) : visibleLeaves.length === 0 ? (
            <EmptyState icon={Briefcase} title="휴가 신청 내역이 없습니다" description="새로운 휴가를 신청해 보세요." />
          ) : visibleLeaves.map((leave) => (
            <div key={leave.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                  {(leave.applicant_name ?? '?').charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{leave.applicant_name} · {leave.leave_type}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {leave.start_date}{leave.start_date !== leave.end_date ? ` ~ ${leave.end_date}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">{leave.reason}</p>
                  {leave.rejection_reason && (
                    <p className="text-xs text-destructive mt-0.5">반려 사유: {leave.rejection_reason}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge
                  status={leave.status === 'approved' ? 'success' : leave.status === 'rejected' ? 'destructive' : 'warning'}
                  label={leave.status === 'approved' ? '승인' : leave.status === 'rejected' ? '반려' : '대기'}
                />
                {leave.status === 'pending' && isManager && leave.applicant_user_id !== user?.id && (
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => handleApprove(leave.id)} disabled={approveLeave.isPending}>승인</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleRejectOpen(leave.id)}>반려</Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Reject reason dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>휴가 반려</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>반려 사유</Label>
              <Textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="반려 사유를 입력하세요 (선택)"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setRejectDialogOpen(false)}>취소</Button>
              <Button variant="destructive" className="flex-1" onClick={handleRejectConfirm} disabled={rejectLeave.isPending}>
                {rejectLeave.isPending ? '처리 중...' : '반려'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leave;
