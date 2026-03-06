import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, TrendingUp, TrendingDown, Target, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  useMonthlySales,
  useMonthlyTarget,
  useSalesSummary,
  useUpsertSalesRecord,
  useUpsertSalesTarget,
  useDeleteSalesRecord,
} from '@/hooks/useSales';

const formatCurrency = (val: number) => `₩${val.toLocaleString()}`;

const Sales = () => {
  const { data: records = [], isLoading } = useMonthlySales();
  const { data: target } = useMonthlyTarget();
  const summary = useSalesSummary();
  const upsertRecord = useUpsertSalesRecord();
  const upsertTarget = useUpsertSalesTarget();
  const deleteRecord = useDeleteSalesRecord();

  const [salesDialogOpen, setSalesDialogOpen] = useState(false);
  const [targetDialogOpen, setTargetDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<{ id?: string; date: string; amount: string; notes: string }>({
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    notes: '',
  });
  const [targetInput, setTargetInput] = useState(target?.target_amount?.toString() ?? '');

  const yearMonth = format(new Date(), 'yyyy-MM');

  const handleSaveSales = () => {
    const amount = Number(editRecord.amount);
    if (!editRecord.date || isNaN(amount) || amount <= 0) {
      toast.error('날짜와 금액을 올바르게 입력해주세요');
      return;
    }
    upsertRecord.mutate(
      { date: editRecord.date, amount, notes: editRecord.notes || undefined },
      {
        onSuccess: () => {
          toast.success('매출이 저장되었습니다');
          setSalesDialogOpen(false);
          setEditRecord({ date: format(new Date(), 'yyyy-MM-dd'), amount: '', notes: '' });
        },
        onError: () => toast.error('매출 저장에 실패했습니다'),
      }
    );
  };

  const handleSaveTarget = () => {
    const amount = Number(targetInput);
    if (isNaN(amount) || amount <= 0) {
      toast.error('목표 금액을 올바르게 입력해주세요');
      return;
    }
    upsertTarget.mutate(
      { yearMonth, targetAmount: amount },
      {
        onSuccess: () => {
          toast.success('목표가 설정되었습니다');
          setTargetDialogOpen(false);
        },
        onError: () => toast.error('목표 설정에 실패했습니다'),
      }
    );
  };

  const handleDelete = (id: string) => {
    if (!confirm('이 매출 기록을 삭제하시겠습니까?')) return;
    deleteRecord.mutate(id, {
      onSuccess: () => toast.success('삭제되었습니다'),
      onError: () => toast.error('삭제에 실패했습니다'),
    });
  };

  const openEdit = (record: { id: string; date: string; amount: number; notes: string | null }) => {
    setEditRecord({
      id: record.id,
      date: record.date,
      amount: record.amount.toString(),
      notes: record.notes ?? '',
    });
    setSalesDialogOpen(true);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">매출 관리</h1>
          <p className="text-muted-foreground text-sm mt-1">일별 매출 입력 및 목표 달성 현황</p>
        </div>
        <div className="flex gap-2">
          {/* Target Dialog */}
          <Dialog open={targetDialogOpen} onOpenChange={setTargetDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setTargetInput(target?.target_amount?.toString() ?? '')}>
                <Target className="w-4 h-4 mr-2" />
                월 목표
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{format(new Date(), 'yyyy년 M월', { locale: ko })} 매출 목표</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div>
                  <Label>목표 금액 (원)</Label>
                  <Input
                    type="number"
                    placeholder="65000000"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleSaveTarget} disabled={upsertTarget.isPending}>
                  저장
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Sales Entry Dialog */}
          <Dialog open={salesDialogOpen} onOpenChange={(open) => {
            setSalesDialogOpen(open);
            if (!open) setEditRecord({ date: format(new Date(), 'yyyy-MM-dd'), amount: '', notes: '' });
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                매출 입력
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editRecord.id ? '매출 수정' : '매출 입력'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div>
                  <Label>날짜</Label>
                  <Input
                    type="date"
                    value={editRecord.date}
                    onChange={(e) => setEditRecord((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>매출 금액 (원)</Label>
                  <Input
                    type="number"
                    placeholder="1500000"
                    value={editRecord.amount}
                    onChange={(e) => setEditRecord((prev) => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>메모 (선택)</Label>
                  <Input
                    placeholder="특이사항 입력"
                    value={editRecord.notes}
                    onChange={(e) => setEditRecord((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                <Button className="w-full" onClick={handleSaveSales} disabled={upsertRecord.isPending}>
                  저장
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">오늘 매출</p>
            <p className="text-xl font-bold mt-1">{formatCurrency(summary.todaySales)}</p>
            {summary.dailyChange !== 0 && (
              <div className="flex items-center justify-center gap-1 mt-1">
                {summary.dailyChange >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-destructive" />
                )}
                <span className={`text-xs ${summary.dailyChange >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                  {summary.dailyChange >= 0 ? '+' : ''}{summary.dailyChange.toFixed(1)}% 전일대비
                </span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">주간 매출</p>
            <p className="text-xl font-bold mt-1">{formatCurrency(summary.weekSales)}</p>
            {summary.weeklyChange !== 0 && (
              <div className="flex items-center justify-center gap-1 mt-1">
                {summary.weeklyChange >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-destructive" />
                )}
                <span className={`text-xs ${summary.weeklyChange >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                  {summary.weeklyChange >= 0 ? '+' : ''}{summary.weeklyChange.toFixed(1)}% 전주대비
                </span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">월간 목표</p>
            <p className="text-xl font-bold mt-1">
              {summary.targetAmount > 0 ? formatCurrency(summary.targetAmount) : '미설정'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">달성률</p>
            <p className="text-xl font-bold mt-1">{summary.achievementRate.toFixed(1)}%</p>
            <Progress value={Math.min(summary.achievementRate, 100)} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Daily Sales List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">일별 매출</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">로딩 중...</p>
          ) : records.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">매출 기록이 없습니다</p>
              <p className="text-xs text-muted-foreground mt-1">상단의 '매출 입력' 버튼으로 추가해보세요</p>
            </div>
          ) : (
            records.map((record) => {
              const targetDaily = summary.targetAmount > 0 ? summary.targetAmount / 30 : 0;
              const pct = targetDaily > 0 ? (Number(record.amount) / targetDaily) * 100 : 0;
              return (
                <div key={record.id} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">
                      {format(new Date(record.date), 'M/d (EEE)', { locale: ko })}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{formatCurrency(Number(record.amount))}</span>
                      {targetDaily > 0 && (
                        <span className="text-xs text-muted-foreground">
                          / {formatCurrency(Math.round(targetDaily))}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => openEdit(record)}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => handleDelete(record.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  {targetDaily > 0 && <Progress value={Math.min(pct, 100)} className="h-2" />}
                  {record.notes && (
                    <p className="text-xs text-muted-foreground">{record.notes}</p>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Monthly Achievement */}
      {summary.targetAmount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {format(new Date(), 'yyyy년 M월', { locale: ko })} 목표 달성 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>누적 매출</span>
                <span className="font-medium">{formatCurrency(summary.monthTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>목표</span>
                <span className="font-medium">{formatCurrency(summary.targetAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>남은 금액</span>
                <span className="font-medium">
                  {formatCurrency(Math.max(summary.targetAmount - summary.monthTotal, 0))}
                </span>
              </div>
              <Progress value={Math.min(summary.achievementRate, 100)} className="h-3 mt-2" />
              <p className="text-center text-sm font-semibold mt-1">
                {summary.achievementRate.toFixed(1)}% 달성
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Sales;
