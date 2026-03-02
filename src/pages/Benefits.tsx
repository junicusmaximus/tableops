import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/common/StatusBadge';
import { Plus, Gift } from 'lucide-react';

const demoBenefits = [
  { id: 1, name: '식대 지원', type: '월간', amount: '₩300,000', eligibility: '전 직원', status: '지급중' },
  { id: 2, name: '직원 할인', type: '상시', amount: '30% 할인', eligibility: '정규직', status: '활성' },
  { id: 3, name: '생일 축하금', type: '연간', amount: '₩50,000', eligibility: '전 직원', status: '활성' },
  { id: 4, name: '인센티브', type: '분기', amount: '매출 목표 달성 시', eligibility: '매니저 이상', status: '활성' },
  { id: 5, name: '교육비 지원', type: '연간', amount: '₩500,000', eligibility: '1년 이상 근무자', status: '활성' },
];

const Benefits = () => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">복리후생</h1>
          <p className="text-muted-foreground text-sm mt-1">직원 복리후생 관리</p>
        </div>
        <Button><Plus className="w-4 h-4 mr-2" />혜택 추가</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">복리후생 목록</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {demoBenefits.map((b) => (
            <div key={b.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
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
