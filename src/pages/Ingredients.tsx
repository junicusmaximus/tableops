import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { Plus, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Ingredient {
  id: number;
  name: string;
  category: string;
  expiry: string;
  daysLeft: number;
  qty: string;
  status: string;
  checked: boolean;
}

const initialIngredients: Ingredient[] = [
  { id: 1, name: '닭가슴살', category: '육류', expiry: '2026-03-03', daysLeft: 1, qty: '2kg', status: '당일 소진', checked: false },
  { id: 2, name: '생크림', category: '유제품', expiry: '2026-03-04', daysLeft: 2, qty: '500ml', status: '빠른 사용', checked: false },
  { id: 3, name: '연어', category: '수산물', expiry: '2026-03-05', daysLeft: 3, qty: '1.5kg', status: '점검 필요', checked: false },
  { id: 4, name: '소고기 등심', category: '육류', expiry: '2026-03-06', daysLeft: 4, qty: '3kg', status: '양호', checked: false },
  { id: 5, name: '두부', category: '기타', expiry: '2026-03-04', daysLeft: 2, qty: '10개', status: '빠른 사용', checked: false },
  { id: 6, name: '달걀', category: '기타', expiry: '2026-03-10', daysLeft: 8, qty: '30개', status: '양호', checked: false },
];

const Ingredients = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Ingredient[]>(initialIngredients);
  const [searchQuery, setSearchQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<Ingredient | null>(null);
  const [form, setForm] = useState({ name: '', category: '육류', expiry: '', qty: '' });

  const filtered = items.filter(i => i.name.includes(searchQuery) || i.category.includes(searchQuery));

  const handleCheck = (id: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, checked: true } : i));
    toast({ title: '점검 완료', description: '식재료 점검이 완료되었습니다.' });
  };

  const handleCheckAll = () => {
    setItems(prev => prev.map(i => ({ ...i, checked: true })));
    toast({ title: '전체 점검 완료', description: '모든 식재료 점검이 완료되었습니다.' });
  };

  const handleAdd = () => {
    if (!form.name || !form.expiry) {
      toast({ title: '입력 오류', description: '식재료명과 유통기한을 입력해주세요.', variant: 'destructive' });
      return;
    }
    const daysLeft = Math.ceil((new Date(form.expiry).getTime() - Date.now()) / 86400000);
    setItems(prev => [...prev, { id: Date.now(), name: form.name, category: form.category, expiry: form.expiry, daysLeft, qty: form.qty || '-', status: daysLeft <= 1 ? '당일 소진' : daysLeft <= 3 ? '점검 필요' : '양호', checked: false }]);
    setAddOpen(false);
    setForm({ name: '', category: '육류', expiry: '', qty: '' });
    toast({ title: '등록 완료', description: '식재료가 등록되었습니다.' });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">식재료 관리</h1>
          <p className="text-muted-foreground text-sm mt-1">유통기한 임박 식재료 점검</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild><Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" />등록</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>식재료 등록</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>식재료명 *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="예: 닭가슴살" /></div>
                <div><Label>카테고리</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="예: 육류" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>유통기한 *</Label><Input type="date" value={form.expiry} onChange={e => setForm({ ...form, expiry: e.target.value })} /></div>
                  <div><Label>수량</Label><Input value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })} placeholder="예: 2kg" /></div>
                </div>
                <Button onClick={handleAdd} className="w-full">등록</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button size="sm" onClick={handleCheckAll}><CheckCircle className="w-4 h-4 mr-1" />전체 점검 완료</Button>
        </div>
      </div>

      <Sheet open={detailItem !== null} onOpenChange={() => setDetailItem(null)}>
        <SheetContent>
          <SheetHeader><SheetTitle>식재료 상세</SheetTitle></SheetHeader>
          {detailItem && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">식재료명</span><span className="text-sm font-medium">{detailItem.name}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">카테고리</span><span className="text-sm">{detailItem.category}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">유통기한</span><span className="text-sm">{detailItem.expiry}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">잔량</span><span className="text-sm">{detailItem.qty}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">상태</span><StatusBadge status={detailItem.daysLeft <= 1 ? 'destructive' : detailItem.daysLeft <= 3 ? 'warning' : 'success'} label={`D-${detailItem.daysLeft}`} /></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">점검</span><span className="text-sm">{detailItem.checked ? '✅ 완료' : '미완료'}</span></div>
              </div>
              {!detailItem.checked && (
                <Button className="w-full" onClick={() => { handleCheck(detailItem.id); setDetailItem(null); }}>
                  <CheckCircle className="w-4 h-4 mr-2" />점검 완료
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-destructive">{items.filter(i => i.daysLeft <= 1).length}</p><p className="text-xs text-muted-foreground">긴급 (D-1)</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-warning">{items.filter(i => i.daysLeft > 1 && i.daysLeft <= 3).length}</p><p className="text-xs text-muted-foreground">주의 (D-3)</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-success">{items.filter(i => i.daysLeft > 3).length}</p><p className="text-xs text-muted-foreground">양호</p></CardContent></Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="식재료 검색..." className="pl-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">식재료 목록</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {filtered.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="식재료가 없습니다" description="식재료를 등록해 주세요." action={<Button size="sm" onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-1" />등록</Button>} />
          ) : filtered.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-3 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 rounded-lg px-2 transition-colors" onClick={() => setDetailItem(item)}>
              <div className="flex items-center gap-3">
                {item.daysLeft <= 1 && <AlertTriangle className="w-4 h-4 text-destructive" />}
                <div>
                  <p className={`text-sm font-medium ${item.checked ? 'line-through text-muted-foreground' : ''}`}>{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.category} · 잔량 {item.qty}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">{item.expiry}</p>
                <StatusBadge status={item.daysLeft <= 1 ? 'destructive' : item.daysLeft <= 3 ? 'warning' : 'success'} label={`D-${item.daysLeft}`} />
                {!item.checked && (
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleCheck(item.id); }}>
                    <CheckCircle className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Ingredients;
