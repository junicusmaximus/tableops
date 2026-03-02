import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Bell } from 'lucide-react';

const demoAnnouncements = [
  { id: 1, title: '3월 신메뉴 교육 일정 안내', content: '3월 5일(수) 14:00~16:00 전 매장 주방/홀 직원 대상 신메뉴 교육이 진행됩니다.', author: '본사 운영팀', date: '2026-03-01', pinned: true },
  { id: 2, title: '3월 위생 점검 일정', content: '3월 10일(월) 본사 위생 점검이 예정되어 있습니다. 각 매장 위생 관리 철저 부탁드립니다.', author: '본사 품질팀', date: '2026-02-28', pinned: true },
  { id: 3, title: '급여일 변경 안내', content: '3월부터 급여일이 매월 25일에서 매월 말일로 변경됩니다.', author: '인사팀', date: '2026-02-25', pinned: false },
];

const Announcements = () => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">공지사항</h1>
          <p className="text-muted-foreground text-sm mt-1">전체 공지 및 매장 공지</p>
        </div>
        <Button><Plus className="w-4 h-4 mr-2" />공지 작성</Button>
      </div>

      <div className="space-y-3">
        {demoAnnouncements.map((ann) => (
          <Card key={ann.id}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {ann.pinned && <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">📌 고정</span>}
                    <h3 className="font-semibold text-sm">{ann.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{ann.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">{ann.author} · {ann.date}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Announcements;
