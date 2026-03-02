import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/common/StatusBadge';
import { Plus, FileText, CheckCircle } from 'lucide-react';

const demoReports = [
  { id: 1, type: '오픈', date: '2026-03-02', author: '김민수', status: 'in_progress', completedItems: 8, totalItems: 12, time: '09:00' },
  { id: 2, type: '마감', date: '2026-03-01', author: '이지은', status: 'completed', completedItems: 15, totalItems: 15, time: '22:30' },
  { id: 3, type: '오픈', date: '2026-03-01', author: '김민수', status: 'approved', completedItems: 12, totalItems: 12, time: '09:00' },
];

const demoOperationLogs = [
  { id: 1, category: '고객 컴플레인', title: '음식 온도 불만', status: 'resolved', author: '박서준', date: '2026-03-01' },
  { id: 2, category: '시설 고장', title: '2번 테이블 의자 흔들림', status: 'open', author: '김민수', date: '2026-03-02' },
  { id: 3, category: '분실물', title: '지갑 분실 접수', status: 'in_review', author: '한소영', date: '2026-03-02' },
];

const statusMap = {
  in_progress: { status: 'warning' as const, label: '진행중' },
  completed: { status: 'success' as const, label: '완료' },
  approved: { status: 'info' as const, label: '승인됨' },
  open: { status: 'destructive' as const, label: '미해결' },
  in_review: { status: 'warning' as const, label: '검토중' },
  resolved: { status: 'success' as const, label: '해결' },
};

const Reports = () => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">일지 / 보고서</h1>
          <p className="text-muted-foreground text-sm mt-1">오픈/마감 보고서 및 운영 일지</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          보고서 작성
        </Button>
      </div>

      {/* Opening/Closing Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">오픈/마감 보고서</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {demoReports.map((report) => (
            <div key={report.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{report.type} 보고서</p>
                  <p className="text-xs text-muted-foreground">{report.date} · {report.author} · {report.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{report.completedItems}/{report.totalItems}</span>
                <StatusBadge {...statusMap[report.status as keyof typeof statusMap]} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Operation Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">운영 일지</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {demoOperationLogs.map((log) => (
            <div key={log.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge {...statusMap[log.status as keyof typeof statusMap]} />
                  <span className="text-xs text-muted-foreground">{log.category}</span>
                </div>
                <p className="text-sm font-medium">{log.title}</p>
                <p className="text-xs text-muted-foreground">{log.date} · {log.author}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
