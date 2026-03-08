import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import EmptyState from '@/components/common/EmptyState';
import { Plus, Search, BookOpen, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsManager } from '@/hooks/useUserRole';

interface Term { id: number; term: string; category: string; definition: string; example: string; }

const categories = ['전체', '홀', '주방', '서비스', '재고', '위생', '구매', 'CS'];

const initialTerms: Term[] = [
  { id: 1, term: '투핸드 서비스', category: '서비스', definition: '두 손으로 음식이나 음료를 제공하는 서비스 방식.', example: '메인 요리를 서빙할 때 반드시 투핸드 서비스로 제공합니다.' },
  { id: 2, term: 'FIFO', category: '재고', definition: 'First In First Out. 먼저 입고된 식재료를 먼저 사용하는 원칙.', example: '냉장고 정리 시 새로 입고된 재료는 뒤에, 기존 재료는 앞에 배치합니다.' },
  { id: 3, term: '미장플라스', category: '주방', definition: 'Mise en place. 조리 전 모든 재료와 도구를 미리 준비하는 것.', example: '오픈 전 미장플라스를 완료하여 서비스 준비를 마칩니다.' },
  { id: 4, term: '86', category: '주방', definition: '메뉴 품절을 의미하는 업계 용어.', example: '"연어 스테이크 86!" - 연어 스테이크가 품절되었음을 알림.' },
  { id: 5, term: 'SOP', category: '서비스', definition: 'Standard Operating Procedure. 표준 운영 절차.', example: '신입 직원은 첫 주에 모든 SOP를 숙지해야 합니다.' },
  { id: 6, term: '크로스 컨태미네이션', category: '위생', definition: '교차 오염. 다른 식품이나 오염원에 의해 식품이 오염되는 것.', example: '날고기 도마와 채소 도마를 반드시 구분하여 사용합니다.' },
];

const Glossary = () => {
  const { toast } = useToast();
  const isManager = useIsManager();
  const [terms, setTerms] = useState<Term[]>(initialTerms);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [detailTerm, setDetailTerm] = useState<Term | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ term: '', category: '서비스', definition: '', example: '' });
  const [editForm, setEditForm] = useState({ term: '', category: '', definition: '', example: '' });

  const filtered = terms.filter(t => {
    const matchCat = selectedCategory === '전체' || t.category === selectedCategory;
    const matchSearch = t.term.includes(searchQuery) || t.definition.includes(searchQuery);
    return matchCat && matchSearch;
  });

  const handleAdd = () => {
    if (!form.term || !form.definition) {
      toast({ title: '입력 오류', description: '용어와 정의를 입력해주세요.', variant: 'destructive' });
      return;
    }
    setTerms(prev => [...prev, { ...form, id: Date.now() }]);
    setAddOpen(false);
    setForm({ term: '', category: '서비스', definition: '', example: '' });
    toast({ title: '등록 완료', description: '용어가 등록되었습니다.' });
  };

  const handleSaveEdit = () => {
    if (!detailTerm) return;
    setTerms(prev => prev.map(t => t.id === detailTerm.id ? { ...t, ...editForm } : t));
    setEditMode(false);
    setDetailTerm({ ...detailTerm, ...editForm });
    toast({ title: '수정 완료', description: '용어가 수정되었습니다.' });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">용어 / 매뉴얼</h1>
          <p className="text-muted-foreground text-sm mt-1">레스토랑 운영 용어 사전</p>
        </div>
        {isManager && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />용어 추가</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>용어 추가</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>용어 *</Label><Input value={form.term} onChange={e => setForm({ ...form, term: e.target.value })} placeholder="예: FIFO" /></div>
                <div><Label>카테고리</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="예: 재고" /></div>
                <div><Label>정의 *</Label><Textarea value={form.definition} onChange={e => setForm({ ...form, definition: e.target.value })} placeholder="용어의 정의" rows={3} /></div>
                <div><Label>사용 예시</Label><Input value={form.example} onChange={e => setForm({ ...form, example: e.target.value })} placeholder="실제 사용 예시" /></div>
                <Button onClick={handleAdd} className="w-full">등록</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Sheet open={detailTerm !== null} onOpenChange={() => { setDetailTerm(null); setEditMode(false); }}>
        <SheetContent>
          <SheetHeader><SheetTitle>용어 상세</SheetTitle></SheetHeader>
          {detailTerm && !editMode && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">용어</span><span className="text-sm font-bold">{detailTerm.term}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">카테고리</span><span className="text-xs bg-muted px-2 py-0.5 rounded-full">{detailTerm.category}</span></div>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg"><p className="text-sm">{detailTerm.definition}</p></div>
              {detailTerm.example && <div className="bg-primary/5 p-3 rounded-lg"><p className="text-sm italic">💡 {detailTerm.example}</p></div>}
              {isManager && (
                <Button variant="outline" className="w-full" onClick={() => { setEditForm(detailTerm); setEditMode(true); }}>
                  <Edit className="w-4 h-4 mr-2" />수정
                </Button>
              )}
            </div>
          )}
          {detailTerm && editMode && (
            <div className="space-y-4 mt-4">
              <div><Label>용어</Label><Input value={editForm.term} onChange={e => setEditForm({ ...editForm, term: e.target.value })} /></div>
              <div><Label>카테고리</Label><Input value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} /></div>
              <div><Label>정의</Label><Textarea value={editForm.definition} onChange={e => setEditForm({ ...editForm, definition: e.target.value })} rows={3} /></div>
              <div><Label>예시</Label><Input value={editForm.example} onChange={e => setEditForm({ ...editForm, example: e.target.value })} /></div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditMode(false)}>취소</Button>
                <Button className="flex-1" onClick={handleSaveEdit}>저장</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {categories.map((cat) => (
          <Button key={cat} variant={cat === selectedCategory ? 'default' : 'outline'} size="sm" className="shrink-0" onClick={() => setSelectedCategory(cat)}>{cat}</Button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="용어 검색..." className="pl-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <EmptyState icon={BookOpen} title="용어가 없습니다" description="검색 조건을 변경하거나 새 용어를 추가해 주세요." />
        ) : filtered.map((term) => (
          <Card key={term.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDetailTerm(term)}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0 mt-0.5">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{term.term}</h3>
                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{term.category}</span>
                  </div>
                  <p className="text-sm text-foreground line-clamp-2">{term.definition}</p>
                  {term.example && <p className="text-xs text-muted-foreground mt-2 italic line-clamp-1">💡 {term.example}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Glossary;
