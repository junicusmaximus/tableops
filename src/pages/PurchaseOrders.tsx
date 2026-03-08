import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { Plus, CheckCircle, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OrderItem { name: string; checked: boolean; }
interface Order { id: number; supplier: string; items: OrderItem[]; expectedTime: string; status: 'pending' | 'confirmed' | 'partial'; notes?: string; }

const initialOrders: Order[] = [
  { id: 1, supplier: '농협유통', items: [{ name: '양파 10kg', checked: false }, { name: '당근 5kg', checked: false }, { name: '감자 8kg', checked: false }, { name: '배추 3포기', checked: false }, { name: '대파 2단', checked: false }], expectedTime: '10:00', status: 'pending' },
  { id: 2, supplier: '삼진수산', items: [{ name: '광어 2kg', checked: false }, { name: '연어 1.5kg', checked: false }, { name: '새우 3kg', checked: false }], expectedTime: '11:00', status: 'pending' },
  { id: 3, supplier: '한우마을', items: [{ name: '소고기 등심 5kg', checked: false }, { name: '안심 3kg', checked: false }], expectedTime: '14:00', status: 'pending' },
];

const PurchaseOrders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ supplier: '', items: '', expectedTime: '', notes: '' });

  const handleToggleItem = (orderId: number, itemIdx: number) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const newItems = o.items.map((it, i) => i === itemIdx ? { ...it, checked: !it.checked } : it);
      return { ...o, items: newItems };
    }));
  };

  const handleConfirmOrder = (orderId: number) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const allChecked = o.items.every(i => i.checked);
      const someChecked = o.items.some(i => i.checked);
      return { ...o, status: allChecked ? 'confirmed' : someChecked ? 'partial' : 'pending', items: o.items.map(i => ({ ...i, checked: true })) };
    }));
    toast({ title: '입고 확인 완료', description: '입고가 확인되었습니다.' });
  };

  const handleAdd = () => {
    if (!form.supplier || !form.items) {
      toast({ title: '입력 오류', description: '공급업체와 품목을 입력해주세요.', variant: 'destructive' });
      return;
    }
    const newOrder: Order = {
      id: Date.now(),
      supplier: form.supplier,
      items: form.items.split(',').map(s => ({ name: s.trim(), checked: false })),
      expectedTime: form.expectedTime || '미정',
      status: 'pending',
      notes: form.notes,
    };
    setOrders(prev => [...prev, newOrder]);
    setAddOpen(false);
    setForm({ supplier: '', items: '', expectedTime: '', notes: '' });
    toast({ title: '발주 등록', description: '새 발주가 등록되었습니다.' });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">발주 / 입고 확인</h1>
          <p className="text-muted-foreground text-sm mt-1">오늘 입고 예정 항목 확인</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />발주 등록</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>발주 등록</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>공급업체 *</Label><Input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} placeholder="예: 농협유통" /></div>
              <div><Label>품목 * (쉼표로 구분)</Label><Textarea value={form.items} onChange={e => setForm({ ...form, items: e.target.value })} placeholder="양파 10kg, 당근 5kg, 감자 8kg" /></div>
              <div><Label>입고 예정 시간</Label><Input type="time" value={form.expectedTime} onChange={e => setForm({ ...form, expectedTime: e.target.value })} /></div>
              <div><Label>메모</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="특이사항" /></div>
              <Button onClick={handleAdd} className="w-full">등록</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="발주 내역이 없습니다" description="새 발주를 등록해 주세요." action={<Button size="sm" onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-1" />발주 등록</Button>} />
        ) : orders.map((order) => (
          <Card key={order.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-primary" />
                  <CardTitle className="text-base">{order.supplier}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{order.expectedTime} 예정</span>
                  <StatusBadge status={order.status === 'confirmed' ? 'success' : order.status === 'partial' ? 'warning' : 'default'} label={order.status === 'confirmed' ? '입고 완료' : order.status === 'partial' ? '부분 입고' : '대기'} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 mb-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <Checkbox checked={item.checked} onCheckedChange={() => handleToggleItem(order.id, i)} disabled={order.status === 'confirmed'} />
                    <span className={`text-sm ${item.checked ? 'line-through text-muted-foreground' : ''}`}>{item.name}</span>
                  </div>
                ))}
              </div>
              {order.status !== 'confirmed' && (
                <Button variant="outline" size="sm" className="w-full" onClick={() => handleConfirmOrder(order.id)}>
                  <CheckCircle className="w-4 h-4 mr-2" />입고 확인 완료
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PurchaseOrders;
