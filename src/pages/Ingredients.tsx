import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/common/StatusBadge';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const demoIngredients = [
  { id: 1, name: '닭가슴살', category: '육류', expiry: '2026-03-03', daysLeft: 1, qty: '2kg', status: '당일 소진' },
  { id: 2, name: '생크림', category: '유제품', expiry: '2026-03-04', daysLeft: 2, qty: '500ml', status: '빠른 사용' },
  { id: 3, name: '연어', category: '수산물', expiry: '2026-03-05', daysLeft: 3, qty: '1.5kg', status: '점검 필요' },
  { id: 4, name: '소고기 등심', category: '육류', expiry: '2026-03-06', daysLeft: 4, qty: '3kg', status: '양호' },
  { id: 5, name: '두부', category: '기타', expiry: '2026-03-04', daysLeft: 2, qty: '10개', status: '빠른 사용' },
  { id: 6, name: '달걀', category: '기타', expiry: '2026-03-10', daysLeft: 8, qty: '30개', status: '양호' },
];

const Ingredients = () => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">식재료 관리</h1>
          <p className="text-muted-foreground text-sm mt-1">유통기한 임박 식재료 점검</p>
        </div>
        <Button>
          <CheckCircle className="w-4 h-4 mr-2" />
          점검 완료
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-destructive">{demoIngredients.filter(i => i.daysLeft <= 1).length}</p>
            <p className="text-xs text-muted-foreground">긴급 (D-1)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-warning">{demoIngredients.filter(i => i.daysLeft > 1 && i.daysLeft <= 3).length}</p>
            <p className="text-xs text-muted-foreground">주의 (D-3)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-success">{demoIngredients.filter(i => i.daysLeft > 3).length}</p>
            <p className="text-xs text-muted-foreground">양호</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">식재료 목록</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {demoIngredients.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                {item.daysLeft <= 1 && <AlertTriangle className="w-4 h-4 text-destructive" />}
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.category} · 잔량 {item.qty}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{item.expiry}</p>
                </div>
                <StatusBadge
                  status={item.daysLeft <= 1 ? 'destructive' : item.daysLeft <= 3 ? 'warning' : 'success'}
                  label={`D-${item.daysLeft}`}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Ingredients;
