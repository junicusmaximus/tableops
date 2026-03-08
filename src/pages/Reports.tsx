import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { Plus, FileText, CheckCircle, Edit, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Report {
  id: number;
  type: string;
  date: string;
  author: string;
  status: string;
  completedItems: number;
  totalItems: number;
  time: string;
  notes?: string;
}

interface OperationLog {
  id: number;
  category: string;
  title: string;
  status: string;
  author: string;
  date: string;
  description?: string;
}

const statusMap: Record<string, { status: 'warning' | 'success' | 'info' | 'destructive'; label: string }> = {
  in_progress: { status: 'warning', label: '진행중' },
  completed: { status: 'success', label: '완료' },
  approved: { status: 'info', label: '승인됨' },
  open: { status: 'destructive', label: '미해결' },
  in_review: { status: 'warning', label: '검토중' },
  resolved: { status: 'success', label: '해결' },
  draft: { status: 'default' as any, label: '임시저장' },
};

const Reports = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([
    { id: 1, type: '오픈', date: '2026-03-02', author: '김민수', status: 'in_progress', completedItems: 8, totalItems: 12, time: '09:00' },
    { id: 2, type: '마감', date: '2026-03-01', author: '이지은', status: 'completed', completedItems: 15, totalItems: 15, time: '22:30' },
    { id: 3, type: '오픈', date: '2026-03-01', author: '김민수', status: 'approved', completedItems: 12, totalItems: 12, time: '09:00' },
  ]);
  const [logs, setLogs] = useState<OperationLog[]>([
    { id: 1, category: '고객 컴플레인', title: '음식 온도 불만', status: 'resolved', author: '박서준', date: '2026-03-01', description: '메인 요리의 온도가 낮다는 불만. 재조리 후 서비스 디저트 제공.' },
    { id: 2, category: '시설 고장', title: '2번 테이블 의자 흔들림', status: 'open', author: '김민수', date: '2026-03-02', description: '2번 테이블 의자 다리 나사 풀림. 수리 필요.' },
    { id: 3, category: '분실물', title: '지갑 분실 접수', status: 'in_review', author: '한소영', date: '2026-03-02', description: '고객 정OO 지갑 분실 신고. 매장 내 수색 중.' },
  ]);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [detailLog, setDetailLog] = useState<OperationLog | null>(null);
  const [detailReport, setDetailReport] = useState<Report | null>(null);
  const [reportForm, setReportForm] = useState({ type: '오픈', notes: '' });
  const [logForm, setLogForm] = useState({ category: '고객 컴플레인', title: '', description: '' });

  const handleCreateReport = () => {
    const newReport: Report = {
      id: Date.now(), type: reportForm.type, date: new Date().toISOString().slice(0, 10),
      author: '나', status: 'in_progress', completedItems: 0, totalItems: 12,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      notes: reportForm.notes,
    };
    setReports(prev => [newReport, ...prev]);
    setReportDialogOpen(false);
    setReportForm({ type: '오픈', notes: '' });
    toast({ title: '보고서 생성', description: `${reportForm.type} 보고서가 생성되었습니다.` });
  };

  const handleCreateLog = () => {
    if (!logForm.title) {
      toast({ title: '입력 오류', description: '제목을 입력해주세요.', variant: 'destructive' });
      return;
    }
    const newLog: OperationLog = {
      id: Date.now(), category: logForm.category, title: logForm.title,
      status: 'open', author: '나', date: new Date().toISOString().slice(0, 10),
      description: logForm.description,
    };
    setLogs(prev => [newLog, ...prev]);
    setLogDialogOpen(false);
    setLogForm({ category: '고객 컴플레인', title: '', description: '' });
    toast({ title: '운영 일지 등록', description: '운영 일지가 등록되었습니다.' });
  };

  const handleResolveLog = (id: number) => {
    setLogs(prev => prev.map(l => l.id === id ? { ...l, status: 'resolved' } : l));
    setDetailLog(null);
    toast({ title: '해결 완료', description: '이슈가 해결 처리되었습니다.' });
  };

  const handleApproveReport = (id: number) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    setDetailReport(null);
    toast({ title: '승인 완료', description: '보고서가 승인되었습니다.' });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">일지 / 보고서</h1>
          <p className="text-muted-foreground text-sm mt-1">오픈/마감 보고서 및 운영 일지</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Edit className="w-4 h-4 mr-1" />운영일지</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>운영 일지 작성</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>카테고리</Label>
                  <Select value={logForm.category} onValueChange={v => setLogForm({ ...logForm, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['고객 컴플레인', '시설 고장', '분실물', '직원 이슈', '재고 이슈', '위생 점검', '기타'].map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>제목 *</Label><Input value={logForm.title} onChange={e => setLogForm({ ...logForm, title: e.target.value })} placeholder="이슈 제목" /></div>
                <div><Label>상세 내용</Label><Textarea value={logForm.description} onChange={e => setLogForm({ ...logForm, description: e.target.value })} placeholder="상세 내용을 입력하세요" rows={4} /></div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setLogDialogOpen(false); toast({ title: '임시 저장', description: '일지가 임시 저장되었습니다.' }); }}>
                    <Save className="w-4 h-4 mr-1" />임시 저장
                  </Button>
                  <Button className="flex-1" onClick={handleCreateLog}>등록</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" />보고서 작성</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>보고서 작성</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>보고서 유형</Label>
                  <Select value={reportForm.type} onValueChange={v => setReportForm({ ...reportForm, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="오픈">오픈 보고서</SelectItem>
                      <SelectItem value="마감">마감 보고서</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>메모</Label><Textarea value={reportForm.notes} onChange={e => setReportForm({ ...reportForm, notes: e.target.value })} placeholder="특이사항을 기록하세요" rows={3} /></div>
                <Button onClick={handleCreateReport} className="w-full">보고서 생성</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Report detail sheet */}
      <Sheet open={detailReport !== null} onOpenChange={() => setDetailReport(null)}>
        <SheetContent>
          <SheetHeader><SheetTitle>보고서 상세</SheetTitle></SheetHeader>
          {detailReport && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">유형</span><span className="text-sm font-medium">{detailReport.type} 보고서</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">날짜</span><span className="text-sm">{detailReport.date}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">작성자</span><span className="text-sm">{detailReport.author}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">시간</span><span className="text-sm">{detailReport.time}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">진행률</span><span className="text-sm">{detailReport.completedItems}/{detailReport.totalItems}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">상태</span><StatusBadge {...statusMap[detailReport.status]} /></div>
              </div>
              {detailReport.status !== 'approved' && (
                <Button className="w-full" onClick={() => handleApproveReport(detailReport.id)}>
                  <CheckCircle className="w-4 h-4 mr-2" />승인
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Log detail sheet */}
      <Sheet open={detailLog !== null} onOpenChange={() => setDetailLog(null)}>
        <SheetContent>
          <SheetHeader><SheetTitle>운영 일지 상세</SheetTitle></SheetHeader>
          {detailLog && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">카테고리</span><span className="text-sm font-medium">{detailLog.category}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">제목</span><span className="text-sm font-medium">{detailLog.title}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">날짜</span><span className="text-sm">{detailLog.date}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">작성자</span><span className="text-sm">{detailLog.author}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">상태</span><StatusBadge {...statusMap[detailLog.status]} /></div>
              </div>
              {detailLog.description && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm">{detailLog.description}</p>
                </div>
              )}
              {detailLog.status !== 'resolved' && (
                <Button className="w-full" onClick={() => handleResolveLog(detailLog.id)}>
                  <CheckCircle className="w-4 h-4 mr-2" />해결 완료
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Opening/Closing Reports */}
      <Card>
        <CardHeader><CardTitle className="text-base">오픈/마감 보고서</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {reports.length === 0 ? (
            <EmptyState icon={FileText} title="보고서가 없습니다" description="새 보고서를 작성해 주세요." />
          ) : reports.map((report) => (
            <div key={report.id} className="flex items-center justify-between py-3 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 rounded-lg px-2 transition-colors" onClick={() => setDetailReport(report)}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted"><FileText className="w-4 h-4 text-muted-foreground" /></div>
                <div>
                  <p className="text-sm font-medium">{report.type} 보고서</p>
                  <p className="text-xs text-muted-foreground">{report.date} · {report.author} · {report.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{report.completedItems}/{report.totalItems}</span>
                <StatusBadge {...statusMap[report.status]} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Operation Logs */}
      <Card>
        <CardHeader><CardTitle className="text-base">운영 일지</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {logs.length === 0 ? (
            <EmptyState icon={Edit} title="운영 일지가 없습니다" description="새 운영 일지를 작성해 주세요." />
          ) : logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between py-3 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 rounded-lg px-2 transition-colors" onClick={() => setDetailLog(log)}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge {...statusMap[log.status]} />
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
