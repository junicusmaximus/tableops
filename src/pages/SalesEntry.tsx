import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useStoresForUser, useInsertManualSale } from '@/hooks/useSalesRecords';
import { useSalesPermissions } from '@/hooks/useSalesPermissions';
import { ShieldAlert } from 'lucide-react';

const SalesEntry = () => {
  const navigate = useNavigate();
  const perms = useSalesPermissions();
  const { data: stores = [] } = useStoresForUser();
  const insert = useInsertManualSale();

  const [storeId, setStoreId] = useState('');
  const [businessDate, setBusinessDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [salesChannel, setSalesChannel] = useState<string>('dine_in');
  const [totalSales, setTotalSales] = useState('');
  const [cardSales, setCardSales] = useState('');
  const [cashSales, setCashSales] = useState('');
  const [deliverySales, setDeliverySales] = useState('');
  const [alcoholSales, setAlcoholSales] = useState('');
  const [memo, setMemo] = useState('');

  if (!perms.canView) {
    return (
      <Card><CardContent className="py-16 text-center">
        <ShieldAlert className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
        <p className="text-base font-medium">{perms.blockedReason ?? '매출 입력 권한이 없습니다.'}</p>
      </CardContent></Card>
    );
  }

  const handleSubmit = () => {
    const sid = storeId || stores[0]?.id;
    const total = Number(totalSales);
    if (!sid || !businessDate || isNaN(total) || total <= 0) {
      toast.error('매장, 날짜, 총 매출을 올바르게 입력해주세요.');
      return;
    }
    insert.mutate({
      store_id: sid,
      business_date: businessDate,
      payment_method: paymentMethod,
      sales_channel: salesChannel,
      net_sales: total,
      gross_sales: total,
      card_sales: Number(cardSales) || 0,
      cash_sales: Number(cashSales) || 0,
      delivery_sales: Number(deliverySales) || 0,
      alcohol_sales: Number(alcoholSales) || 0,
      memo,
    }, {
      onSuccess: () => { toast.success('매출이 저장되었습니다.'); navigate('/sales'); },
      onError: (e: any) => toast.error(e.message ?? '저장에 실패했습니다.'),
    });
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">매출 직접 입력</h1>
      <Card>
        <CardHeader><CardTitle className="text-base">매출 정보</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>매장</Label>
              <Select value={storeId} onValueChange={setStoreId}>
                <SelectTrigger><SelectValue placeholder="매장 선택" /></SelectTrigger>
                <SelectContent>{stores.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>영업일</Label><Input type="date" value={businessDate} onChange={(e) => setBusinessDate(e.target.value)} /></div>
            <div>
              <Label>결제수단</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">카드</SelectItem>
                  <SelectItem value="cash">현금</SelectItem>
                  <SelectItem value="delivery">배달</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>판매채널</Label>
              <Select value={salesChannel} onValueChange={setSalesChannel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dine_in">매장</SelectItem>
                  <SelectItem value="delivery">배달</SelectItem>
                  <SelectItem value="takeout">포장</SelectItem>
                  <SelectItem value="reservation">예약</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>총 매출 (원)</Label><Input type="number" value={totalSales} onChange={(e) => setTotalSales(e.target.value)} placeholder="1500000" /></div>
            <div><Label>카드 매출</Label><Input type="number" value={cardSales} onChange={(e) => setCardSales(e.target.value)} /></div>
            <div><Label>현금 매출</Label><Input type="number" value={cashSales} onChange={(e) => setCashSales(e.target.value)} /></div>
            <div><Label>배달 매출 (선택)</Label><Input type="number" value={deliverySales} onChange={(e) => setDeliverySales(e.target.value)} /></div>
            <div><Label>주류 매출 (선택)</Label><Input type="number" value={alcoholSales} onChange={(e) => setAlcoholSales(e.target.value)} /></div>
            <div className="col-span-2"><Label>메모</Label><Textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={2} /></div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => navigate('/sales')}>취소</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={insert.isPending}>저장</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesEntry;
