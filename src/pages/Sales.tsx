import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';

const monthlySales = [
  { date: '3/1', amount: 2350000, target: 2500000 },
  { date: '3/2', amount: 1840000, target: 2500000 },
];

const storeRanking = [
  { name: '강남본점', sales: 5320000, target: 7500000, rate: 70.9 },
  { name: '홍대점', sales: 4100000, target: 6000000, rate: 68.3 },
  { name: '이태원점', sales: 3800000, target: 5500000, rate: 69.1 },
];

const Sales = () => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">매출 관리</h1>
          <p className="text-muted-foreground text-sm mt-1">일별 매출 입력 및 목표 달성 현황</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          매출 입력
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">오늘 매출</p>
            <p className="text-xl font-bold mt-1">₩1,840,000</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <TrendingDown className="w-3 h-3 text-destructive" />
              <span className="text-xs text-destructive">-21.7% 전일대비</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">주간 매출</p>
            <p className="text-xl font-bold mt-1">₩4,190,000</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-success" />
              <span className="text-xs text-success">+5.3% 전주대비</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">월간 목표</p>
            <p className="text-xl font-bold mt-1">₩65,000,000</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">달성률</p>
            <p className="text-xl font-bold mt-1">8.2%</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Sales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">일별 매출</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {monthlySales.map((day, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{day.date}</span>
                <span>₩{day.amount.toLocaleString()} / ₩{day.target.toLocaleString()}</span>
              </div>
              <Progress value={(day.amount / day.target) * 100} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Store Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">매장별 매출 비교</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {storeRanking.map((store, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium">{store.name}</p>
                  <p className="text-xs text-muted-foreground">₩{store.sales.toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{store.rate}%</p>
                <Progress value={store.rate} className="h-1.5 w-20" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Sales;
