import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import EmptyState from '@/components/common/EmptyState';
import { Plus, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsManager } from '@/hooks/useUserRole';

interface Announcement { id: number; title: string; content: string; author: string; date: string; pinned: boolean; }

const initialAnnouncements: Announcement[] = [
  { id: 1, title: '3월 신메뉴 교육 일정 안내', content: '3월 5일(수) 14:00~16:00 전 매장 주방/홀 직원 대상 신메뉴 교육이 진행됩니다. 필참 부탁드립니다.', author: '본사 운영팀', date: '2026-03-01', pinned: true },
  { id: 2, title: '3월 위생 점검 일정', content: '3월 10일(월) 본사 위생 점검이 예정되어 있습니다. 각 매장 위생 관리 철저 부탁드립니다.', author: '본사 품질팀', date: '2026-02-28', pinned: true },
  { id: 3, title: '급여일 변경 안내', content: '3월부터 급여일이 매월 25일에서 매월 말일로 변경됩니다.', author: '인사팀', date: '2026-02-25', pinned: false },
];

const Announcements = () => {
  const { toast } = useToast();
  const isManager = useIsManager();
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [addOpen, setAddOpen] = useState(false);
  const [detail, setDetail] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ title: '', content: '', pinned: false });

  const handleCreate = () => {
    if (!form.title || !form.content) {
      toast({ title: '입력 오류', description: '제목과 내용을 입력해주세요.', variant: 'destructive' });
      return;
    }
    setAnnouncements(prev => [{ id: Date.now(), title: form.title, content: form.content, author: '나', date: new Date().toISOString().slice(0, 10), pinned: form.pinned }, ...prev]);
    setAddOpen(false);
    setForm({ title: '', content: '', pinned: false });
    toast({ title: '공지 등록', description: '공지사항이 등록되었습니다.' });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">공지사항</h1>
          <p className="text-muted-foreground text-sm mt-1">전체 공지 및 매장 공지</p>
        </div>
        {isManager && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />공지 작성</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>공지사항 작성</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>제목 *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="공지 제목" /></div>
                <div><Label>내용 *</Label><Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="공지 내용을 입력하세요" rows={5} /></div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={form.pinned} onChange={e => setForm({ ...form, pinned: e.target.checked })} id="pinned" className="rounded" />
                  <Label htmlFor="pinned">상단 고정</Label>
                </div>
                <Button onClick={handleCreate} className="w-full">등록</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Sheet open={detail !== null} onOpenChange={() => setDetail(null)}>
        <SheetContent>
          <SheetHeader><SheetTitle>공지 상세</SheetTitle></SheetHeader>
          {detail && (
            <div className="space-y-4 mt-4">
              <div>
                {detail.pinned && <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">📌 고정</span>}
                <h2 className="text-lg font-bold mt-2">{detail.title}</h2>
                <p className="text-xs text-muted-foreground mt-1">{detail.author} · {detail.date}</p>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{detail.content}</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <div className="space-y-3">
        {announcements.length === 0 ? (
          <EmptyState icon={Bell} title="공지사항이 없습니다" description="새 공지를 작성해 주세요." />
        ) : announcements.map((ann) => (
          <Card key={ann.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDetail(ann)}>
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
                  <p className="text-sm text-muted-foreground line-clamp-2">{ann.content}</p>
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
