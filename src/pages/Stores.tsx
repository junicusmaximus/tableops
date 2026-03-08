import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import StatusBadge from '@/components/common/StatusBadge';
import { Plus, Store as StoreIcon, MapPin, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StoreItem {
  id: number;
  name: string;
  brand: string;
  address: string;
  phone: string;
  manager: string;
  employees: number;
  status: string;
}

const initialStores: StoreItem[] = [
  { id: 1, name: '강남본점', brand: 'TableOps Kitchen', address: '서울 강남구 테헤란로 123', phone: '02-1234-5678', manager: '김민수', employees: 12, status: '운영중' },
  { id: 2, name: '홍대점', brand: 'TableOps Kitchen', address: '서울 마포구 홍익로 45', phone: '02-2345-6789', manager: '최영희', employees: 10, status: '운영중' },
  { id: 3, name: '이태원점', brand: 'TableOps Kitchen', address: '서울 용산구 이태원로 67', phone: '02-3456-7890', manager: '정수민', employees: 8, status: '운영중' },
];

const Stores = () => {
  const { toast } = useToast();
  const [stores, setStores] = useState<StoreItem[]>(initialStores);
  const [addOpen, setAddOpen] = useState(false);
  const [detail, setDetail] = useState<StoreItem | null>(null);
  const [form, setForm] = useState({ name: '', address: '', phone: '', manager: '' });

  const handleAdd = () => {
    if (!form.name) {
      toast({ title: '입력 오류', description: '매장명을 입력해주세요.', variant: 'destructive' });
      return;
    }
    setStores(prev => [...prev, {
      id: Date.now(), name: form.name, brand: 'TableOps Kitchen',
      address: form.address, phone: form.phone, manager: form.manager,
      employees: 0, status: '준비중',
    }]);
    setAddOpen(false);
    setForm({ name: '', address: '', phone: '', manager: '' });
    toast({ title: '등록 완료', description: '새 매장이 등록되었습니다.' });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">매장 관리</h1>
          <p className="text-muted-foreground text-sm mt-1">전체 매장 현황</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />매장 추가</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>새 매장 등록</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>매장명 *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="매장 이름" /></div>
              <div><Label>주소</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="매장 주소" /></div>
              <div><Label>전화번호</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="02-0000-0000" /></div>
              <div><Label>매니저</Label><Input value={form.manager} onChange={e => setForm({ ...form, manager: e.target.value })} placeholder="매니저 이름" /></div>
              <Button onClick={handleAdd} className="w-full">등록</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Sheet open={detail !== null} onOpenChange={() => setDetail(null)}>
        <SheetContent>
          <SheetHeader><SheetTitle>매장 상세</SheetTitle></SheetHeader>
          {detail && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                {[['매장명', detail.name], ['브랜드', detail.brand], ['주소', detail.address], ['전화번호', detail.phone], ['매니저', detail.manager], ['직원 수', `${detail.employees}명`]].map(([l, v]) => (
                  <div key={l} className="flex justify-between"><span className="text-sm text-muted-foreground">{l}</span><span className="text-sm font-medium">{v}</span></div>
                ))}
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">상태</span><StatusBadge status="success" label={detail.status} /></div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <div className="grid lg:grid-cols-2 gap-4">
        {stores.map((store) => (
          <Card key={store.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDetail(store)}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <StoreIcon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{store.name}</h3>
                    <StatusBadge status={store.status === '운영중' ? 'success' : 'warning'} label={store.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{store.brand}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {store.address}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>매니저: {store.manager}</span>
                    <span>직원: {store.employees}명</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Stores;
