import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { Plus, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Benefit { id: number; name: string; type: string; amount: string; eligibility: string; status: string; description?: string; }

const initialBenefits: Benefit[] = [
  { id: 1, name: '식대 지원', type: '월간', amount: '₩300,000', eligibility: '전 직원', status: '지급중', description: '매월 급여에 포함하여 지급됩니다.' },
  { id: 2, name: '직원 할인', type: '상시', amount: '30% 할인', eligibility: '정규직', status: '활성', description: '자사 매장에서 식사 시 30% 할인 적용됩니다.' },
  { id: 3, name: '생일 축하금', type: '연간', amount: '₩50,000', eligibility: '전 직원', status: '활성', description: '생일 당월에 축하금이 지급됩니다.' },
  { id: 4, name: '인센티브', type: '분기', amount: '매출 목표 달성 시', eligibility: '매니저 이상', status: '활성', description: '분기별 매출 목표 달성 시 인센티브가 지급됩니다.' },
  { id: 5, name: '교육비 지원', type: '연간', amount: '₩500,000', eligibility: '1년 이상 근무자', status: '활성', description: '외부 교육 수강 시 연간 50만원까지 지원됩니다.' },
];

const Benefits = () => {
  const { toast } = useToast();
  const [benefits, setBenefits] = useState<Benefit[]>(initialBenefits);
  const [addOpen, setAddOpen] = useState(false);
  const [detail, setDetail] = useState<Benefit | null>(null);
  const [form, setForm] = useState({ name: '', type: '월간', amount: '', eligibility: '전 직원', description: '' });

  const handleAdd = () => {
    if (!form.name || !form.amount) {
      toast({ title: '입력 오류', description: '혜택명과 금액을 입력해주세요.', variant: 'destructive' });
      return;
    }
    setBenefits(prev => [...prev, { ...form, id: Date.now(), status: '활성' }]);
    setAddOpen(false);
    setForm({ name: '', type: '월간', amount: '', eligibility: '전 직원', description: '' });
    toast({ title: '등록 완료', description: '복리후생 혜택이 등록되었습니다.' });
  };

  const handleRequest = (id: number) => {
    toast({ title: '신청 완료', description: '복리후생 신청이 접수되었습니다.' });
    setDetail(null);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">복리후생</h1>
          <p className="text-muted-foreground text-sm mt-1">직원 복리후생 관리</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />혜택 추가</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>복리후생 혜택 추가</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>혜택명 *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="예: 식대 지원" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>유형</Label><Input value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} placeholder="월간, 연간, 상시" /></div>
                <div><Label>금액/내용 *</Label><Input value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="₩300,000" /></div>
              </div>
              <div><Label>대상</Label><Input value={form.eligibility} onChange={e => setForm({ ...form, eligibility: e.target.value })} placeholder="전 직원" /></div>
              <div><Label>설명</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="상세 설명" /></div>
              <Button onClick={handleAdd} className="w-full">등록</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Sheet open={detail !== null} onOpenChange={() => setDetail(null)}>
        <SheetContent>
          <SheetHeader><SheetTitle>혜택 상세</SheetTitle></SheetHeader>
          {detail && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">혜택명</span><span className="text-sm font-medium">{detail.name}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">유형</span><span className="text-sm">{detail.type}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">금액/내용</span><span className="text-sm font-medium">{detail.amount}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">대상</span><span className="text-sm">{detail.eligibility}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">상태</span><StatusBadge status="success" label={detail.status} /></div>
              </div>
              {detail.description && <div className="bg-muted/50 p-3 rounded-lg"><p className="text-sm">{detail.description}</p></div>}
              <Button className="w-full" onClick={() => handleRequest(detail.id)}>신청하기</Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Card>
        <CardHeader><CardTitle className="text-base">복리후생 목록</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {benefits.length === 0 ? (
            <EmptyState icon={Gift} title="복리후생 혜택이 없습니다" description="새 혜택을 추가해 주세요." action={<Button size="sm" onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-1" />추가</Button>} />
          ) : benefits.map((b) => (
            <div key={b.id} className="flex items-center justify-between py-3 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 rounded-lg px-2 transition-colors" onClick={() => setDetail(b)}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10"><Gift className="w-4 h-4 text-accent" /></div>
                <div>
                  <p className="text-sm font-medium">{b.name}</p>
                  <p className="text-xs text-muted-foreground">{b.type} · {b.eligibility}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{b.amount}</span>
                <StatusBadge status="success" label={b.status} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Benefits;
