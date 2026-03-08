import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { Plus, ShoppingCart, AlertTriangle, CheckCircle, XCircle, Clock, Bell, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useIsManager } from '@/hooks/useUserRole';
import {
  usePurchaseRequests,
  useCreatePurchaseRequest,
  useUpdatePurchaseRequest,
  useInventoryAlerts,
  useCheckAndCreateAlerts,
  useResolveAlert,
} from '@/hooks/usePurchaseOrders';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const statusConfig: Record<string, { status: 'default' | 'success' | 'warning' | 'destructive' | 'info'; label: string }> = {
  pending: { status: 'warning', label: '승인 대기' },
  approved: { status: 'success', label: '승인됨' },
  rejected: { status: 'destructive', label: '반려됨' },
  ordered: { status: 'info', label: '발주 완료' },
  received: { status: 'success', label: '입고 완료' },
};

const PurchaseOrders = () => {
  const isManager = useIsManager();
  const { data: requests = [], isLoading: requestsLoading } = usePurchaseRequests();
  const { data: alerts = [], isLoading: alertsLoading } = useInventoryAlerts();
  const createRequest = useCreatePurchaseRequest();
  const updateRequest = useUpdatePurchaseRequest();
  const checkAlerts = useCheckAndCreateAlerts();
  const resolveAlert = useResolveAlert();

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    item_name: '',
    quantity: '',
    unit: 'kg',
    supplier: '',
    notes: '',
  });

  // Check for low stock alerts on mount
  useEffect(() => {
    checkAlerts.mutate();
  }, []);

  const handleCreate = () => {
    if (!form.item_name || !form.quantity) {
      toast.error('품목명과 수량을 입력해주세요');
      return;
    }
    createRequest.mutate(
      {
        item_name: form.item_name,
        quantity: Number(form.quantity),
        unit: form.unit,
        supplier: form.supplier || undefined,
        notes: form.notes || undefined,
      },
      {
        onSuccess: () => {
          setAddOpen(false);
          setForm({ item_name: '', quantity: '', unit: 'kg', supplier: '', notes: '' });
          toast.success('발주 요청이 등록되었습니다');
        },
        onError: () => toast.error('발주 요청 등록에 실패했습니다'),
      }
    );
  };

  const handleStatusUpdate = (id: string, status: string) => {
    updateRequest.mutate(
      { id, status },
      {
        onSuccess: () => toast.success(`상태가 변경되었습니다`),
        onError: () => toast.error('상태 변경에 실패했습니다'),
      }
    );
  };

  const handleResolveAlert = (alertId: string) => {
    resolveAlert.mutate(alertId, {
      onSuccess: () => toast.success('알림이 해결되었습니다'),
    });
  };

  const handleCreateFromAlert = (alert: any) => {
    setForm({
      item_name: alert.item_name ?? '',
      quantity: String(alert.minimum_stock ?? 10),
      unit: alert.unit ?? 'kg',
      supplier: '',
      notes: `재고 부족 알림에서 생성 (현재: ${alert.current_stock}${alert.unit})`,
    });
    setAddOpen(true);
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">발주 관리</h1>
          <p className="text-muted-foreground text-sm mt-1">재고 부족 알림 및 발주 요청을 관리합니다</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />발주 요청
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-warning">{alerts.length}</p>
            <p className="text-xs text-muted-foreground">재고 부족 알림</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-info">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">승인 대기</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-success">{approvedCount}</p>
            <p className="text-xs text-muted-foreground">승인됨</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-foreground">{requests.length}</p>
            <p className="text-xs text-muted-foreground">전체 요청</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="alerts" className="gap-1.5">
            <Bell className="w-4 h-4" />
            재고 부족 알림
            {alerts.length > 0 && (
              <span className="ml-1 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
                {alerts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-1.5">
            <ShoppingCart className="w-4 h-4" />발주 요청
          </TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-3 mt-4">
          {alertsLoading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">로딩 중...</div>
          ) : alerts.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="재고 부족 알림이 없습니다"
              description="모든 재고가 최소 수량 이상입니다."
            />
          ) : (
            alerts.map((alert) => (
              <Card key={alert.id} className="border-warning/30">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">{alert.item_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          현재 재고: <span className="text-destructive font-medium">{alert.current_stock}{alert.unit}</span>
                          {' · '}최소 수량: {alert.minimum_stock}{alert.unit}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(alert.created_at), 'M월 d일 HH:mm', { locale: ko })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCreateFromAlert(alert)}
                      >
                        <ShoppingCart className="w-3.5 h-3.5 mr-1" />발주 요청
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleResolveAlert(alert.id)}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Purchase Requests Tab */}
        <TabsContent value="requests" className="space-y-3 mt-4">
          {requestsLoading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">로딩 중...</div>
          ) : requests.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="발주 요청이 없습니다"
              description="새 발주 요청을 등록해주세요."
              action={<Button size="sm" onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-1" />발주 요청</Button>}
            />
          ) : (
            requests.map((req) => {
              const sc = statusConfig[req.status] ?? statusConfig.pending;
              return (
                <Card key={req.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Package className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{req.item_name}</p>
                            <StatusBadge status={sc.status} label={sc.label} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {req.quantity}{req.unit}
                            {req.supplier && ` · ${req.supplier}`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            요청: {req.requester_name} · {format(new Date(req.created_at), 'M월 d일 HH:mm', { locale: ko })}
                          </p>
                          {req.approver_name && (
                            <p className="text-xs text-muted-foreground">
                              {req.status === 'approved' ? '승인' : '반려'}: {req.approver_name}
                            </p>
                          )}
                          {req.notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">{req.notes}</p>
                          )}
                        </div>
                      </div>

                      {/* Manager actions */}
                      {isManager && req.status === 'pending' && (
                        <div className="flex gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-success border-success/30 hover:bg-success/10"
                            onClick={() => handleStatusUpdate(req.id, 'approved')}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />승인
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => handleStatusUpdate(req.id, 'rejected')}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />반려
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>발주 요청 등록</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>품목명 *</Label>
              <Input
                value={form.item_name}
                onChange={(e) => setForm({ ...form, item_name: e.target.value })}
                placeholder="예: 닭가슴살"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>수량 *</Label>
                <Input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="10"
                />
              </div>
              <div>
                <Label>단위</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="개">개</SelectItem>
                    <SelectItem value="팩">팩</SelectItem>
                    <SelectItem value="박스">박스</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>공급업체</Label>
              <Input
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                placeholder="예: 농협유통"
              />
            </div>
            <div>
              <Label>메모</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="특이사항"
                rows={2}
              />
            </div>
            <Button onClick={handleCreate} disabled={createRequest.isPending} className="w-full">
              {createRequest.isPending ? '등록 중...' : '발주 요청'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseOrders;
