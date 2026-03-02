import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/common/StatusBadge';
import { Plus, Calendar } from 'lucide-react';

const demoLeaves = [
  { id: 1, name: '박서준', type: '연차', start: '2026-03-05', end: '2026-03-05', status: 'pending', reason: '개인 사유' },
  { id: 2, name: '최유나', type: '반차(오전)', start: '2026-03-03', end: '2026-03-03', status: 'approved', reason: '병원 진료' },
  { id: 3, name: '정하늘', type: '연차', start: '2026-03-10', end: '2026-03-11', status: 'pending', reason: '가족 행사' },
  { id: 4, name: '한소영', type: '시간차(2h)', start: '2026-03-04', end: '2026-03-04', status: 'rejected', reason: '은행 업무' },
];

const Leave = () => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">휴가 관리</h1>
          <p className="text-muted-foreground text-sm mt-1">휴가 신청 및 승인 현황</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          휴가 신청
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-warning">2</p><p className="text-xs text-muted-foreground">승인 대기</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-success">1</p><p className="text-xs text-muted-foreground">승인 완료</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-destructive">1</p><p className="text-xs text-muted-foreground">반려</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">휴가 신청 내역</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {demoLeaves.map((leave) => (
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
                    <Button variant="outline" size="sm">승인</Button>
                    <Button variant="ghost" size="sm">반려</Button>
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
