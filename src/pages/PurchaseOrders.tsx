import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/common/StatusBadge';
import { Plus, CheckCircle, ShoppingCart } from 'lucide-react';

const demoOrders = [
  { id: 1, supplier: '농협유통', items: ['양파 10kg', '당근 5kg', '감자 8kg', '배추 3포기', '대파 2단'], expectedTime: '10:00', status: 'pending' },
  { id: 2, supplier: '삼진수산', items: ['광어 2kg', '연어 1.5kg', '새우 3kg'], expectedTime: '11:00', status: 'pending' },
  { id: 3, supplier: '한우마을', items: ['소고기 등심 5kg', '안심 3kg'], expectedTime: '14:00', status: 'pending' },
];

const PurchaseOrders = () => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">발주 / 입고 확인</h1>
          <p className="text-muted-foreground text-sm mt-1">오늘 입고 예정 항목 확인</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          발주 등록
        </Button>
      </div>

      <div className="space-y-4">
        {demoOrders.map((order) => (
          <Card key={order.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-primary" />
                  <CardTitle className="text-base">{order.supplier}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{order.expectedTime} 예정</span>
                  <StatusBadge status="warning" label="대기" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 mb-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <div className="w-4 h-4 rounded border border-border flex items-center justify-center">
                      <span className="text-[10px] text-muted-foreground">☐</span>
                    </div>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <CheckCircle className="w-4 h-4 mr-2" />
                입고 확인 완료
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PurchaseOrders;
