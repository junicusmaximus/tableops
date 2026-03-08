import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ItemAutocomplete from '@/components/inventory/ItemAutocomplete';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import StatusBadge, { StatusType } from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { Plus, Search, Notebook, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Note {
  id: number;
  category: string;
  customer: string;
  content: string;
  importance: string;
  date: string;
  visibleTo: string;
}

const categories = ['전체', '알레르기', '영유아', '재방문', 'VIP', '특별주문', '컴플레인', '칭찬'];
const importanceColors: Record<string, StatusType> = { high: 'destructive', medium: 'warning', low: 'default' };

const initialNotes: Note[] = [
  { id: 1, category: '알레르기', customer: '김OO', content: '갑각류 알레르기. 새우, 게 절대 사용 불가.', importance: 'high', date: '2026-03-01', visibleTo: '전체 공유' },
  { id: 2, category: 'VIP', customer: '이OO', content: 'VIP 단골 고객. 항상 2번 테이블 선호. 스파클링 워터 제공.', importance: 'high', date: '2026-03-01', visibleTo: '매니저 이상' },
  { id: 3, category: '영유아', customer: '박OO', content: '만 2세 아이 동반. 하이체어 필요. 아기 식기 요청.', importance: 'medium', date: '2026-03-02', visibleTo: '전체 공유' },
  { id: 4, category: '특별주문', customer: '최OO', content: '글루텐프리 메뉴 요청. 파스타 대신 쌀면 대체.', importance: 'medium', date: '2026-03-02', visibleTo: '주방+홀' },
  { id: 5, category: '재방문', customer: '정OO', content: '3회 이상 방문. 지난번 서비스 불만 후 재방문. 각별한 응대 필요.', importance: 'high', date: '2026-03-02', visibleTo: '매니저 이상' },
  { id: 6, category: '컴플레인', customer: '한OO', content: '지난주 음식 온도 불만 접수. 사과 서비스 디저트 제공 완료.', importance: 'low', date: '2026-02-28', visibleTo: '매니저 이상' },
];

const ServiceNotes = () => {
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailNote, setDetailNote] = useState<Note | null>(null);
  const [form, setForm] = useState({ category: '알레르기', customer: '', content: '', importance: 'medium', visibleTo: '전체 공유' });

  const filtered = notes.filter(n => {
    const matchCat = selectedCategory === '전체' || n.category === selectedCategory;
    const matchSearch = n.customer.includes(searchQuery) || n.content.includes(searchQuery);
    return matchCat && matchSearch;
  });

  const handleCreate = () => {
    if (!form.customer || !form.content) {
      toast({ title: '입력 오류', description: '고객명과 내용을 입력해주세요.', variant: 'destructive' });
      return;
    }
    setNotes(prev => [{ ...form, id: Date.now(), date: new Date().toISOString().slice(0, 10) }, ...prev]);
    setDialogOpen(false);
    setForm({ category: '알레르기', customer: '', content: '', importance: 'medium', visibleTo: '전체 공유' });
    toast({ title: '등록 완료', description: '고객 서비스 노트가 등록되었습니다.' });
  };

  const handleDelete = (id: number) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    setDetailNote(null);
    toast({ title: '삭제 완료', description: '노트가 삭제되었습니다.' });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">고객 서비스 노트</h1>
          <p className="text-muted-foreground text-sm mt-1">고객별 특이사항 및 서비스 메모</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />노트 작성</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>고객 서비스 노트 작성</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>카테고리</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.filter(c => c !== '전체').map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>고객명 *</Label><Input value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} placeholder="고객명" /></div>
              <div><Label>내용 *</Label><Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="특이사항을 입력하세요" rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>중요도</Label>
                  <Select value={form.importance} onValueChange={v => setForm({ ...form, importance: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">높음</SelectItem>
                      <SelectItem value="medium">보통</SelectItem>
                      <SelectItem value="low">낮음</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>공유 범위</Label>
                  <Select value={form.visibleTo} onValueChange={v => setForm({ ...form, visibleTo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="전체 공유">전체 공유</SelectItem>
                      <SelectItem value="매니저 이상">매니저 이상</SelectItem>
                      <SelectItem value="주방+홀">주방+홀</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full">등록</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Sheet open={detailNote !== null} onOpenChange={() => setDetailNote(null)}>
        <SheetContent>
          <SheetHeader><SheetTitle>노트 상세</SheetTitle></SheetHeader>
          {detailNote && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">고객명</span><span className="text-sm font-medium">{detailNote.customer}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">카테고리</span><StatusBadge status={importanceColors[detailNote.importance]} label={detailNote.category} /></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">공유 범위</span><span className="text-sm">{detailNote.visibleTo}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">등록일</span><span className="text-sm">{detailNote.date}</span></div>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg"><p className="text-sm">{detailNote.content}</p></div>
              <Button variant="destructive" className="w-full" onClick={() => handleDelete(detailNote.id)}>
                <Trash2 className="w-4 h-4 mr-2" />삭제
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {categories.map((cat) => (
          <Button key={cat} variant={cat === selectedCategory ? 'default' : 'outline'} size="sm" className="shrink-0" onClick={() => setSelectedCategory(cat)}>{cat}</Button>
        ))}
      </div>

      <ItemAutocomplete
        storeId={null}
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="고객명, 내용 또는 품목 검색..."
        allowQuickCreate={false}
      />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <EmptyState icon={Notebook} title="노트가 없습니다" description="고객 서비스 노트를 작성해 주세요." action={<Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-1" />노트 작성</Button>} />
        ) : filtered.map((note) => (
          <Card key={note.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDetailNote(note)}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge status={importanceColors[note.importance]} label={note.category} />
                    <span className="text-sm font-semibold">{note.customer}</span>
                    <span className="text-xs text-muted-foreground">{note.visibleTo}</span>
                  </div>
                  <p className="text-sm">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">{note.date}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ServiceNotes;
