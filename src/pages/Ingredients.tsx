import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import ItemAutocomplete from '@/components/inventory/ItemAutocomplete';
import { Plus, Search, ChefHat, Package, AlertTriangle, CheckCircle, Clock, Trash2, Eye, Edit, MinusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/* ───────── types ───────── */
interface PrepItem {
  id: number;
  name: string;
  prepDate: string;
  prepTime: string;
  assignee: string;
  quantity: number;
  unit: string;
  useByDate: string;
  useByHours: number;
  storageLocation: string;
  status: '제조 예정' | '제조 완료' | '사용 완료' | '폐기';
}

interface RawIngredient {
  id: number;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  receivedDate: string;
  expiryDate: string;
  daysLeft: number;
  storageLocation: string;
  status: '정상' | '부족' | '긴급' | '주의' | '폐기';
}

/* ───────── seed data ───────── */
const today = new Date().toISOString().slice(0, 10);

const initialPreps: PrepItem[] = [
  { id: 1, name: '허머스', prepDate: today, prepTime: '07:00', assignee: '김주방', quantity: 3, unit: 'kg', useByDate: today, useByHours: 8, storageLocation: '냉장 1번', status: '제조 완료' },
  { id: 2, name: '발사믹 드레싱', prepDate: today, prepTime: '07:30', assignee: '이주방', quantity: 2, unit: 'L', useByDate: today, useByHours: 12, storageLocation: '냉장 2번', status: '제조 완료' },
  { id: 3, name: '피자 도우', prepDate: today, prepTime: '08:00', assignee: '박주방', quantity: 20, unit: '개', useByDate: today, useByHours: 6, storageLocation: '실온 발효대', status: '제조 예정' },
  { id: 4, name: '육수 (사골)', prepDate: today, prepTime: '06:00', assignee: '김주방', quantity: 15, unit: 'L', useByDate: today, useByHours: 24, storageLocation: '냉장 3번', status: '제조 완료' },
  { id: 5, name: '디저트 베이스 (크렘 브륄레)', prepDate: today, prepTime: '09:00', assignee: '최파티시에', quantity: 10, unit: '개', useByDate: today, useByHours: 4, storageLocation: '냉장 4번', status: '제조 예정' },
  { id: 6, name: '양념 소스', prepDate: today, prepTime: '07:00', assignee: '이주방', quantity: 5, unit: 'L', useByDate: today, useByHours: 2, storageLocation: '냉장 2번', status: '사용 완료' },
];

const initialRaws: RawIngredient[] = [
  { id: 1, name: '닭가슴살', category: '육류', currentStock: 8, unit: 'kg', receivedDate: '2026-03-06', expiryDate: '2026-03-09', daysLeft: 1, storageLocation: '냉장 A', status: '긴급' },
  { id: 2, name: '생크림', category: '유제품', currentStock: 3, unit: 'L', receivedDate: '2026-03-05', expiryDate: '2026-03-10', daysLeft: 2, storageLocation: '냉장 B', status: '주의' },
  { id: 3, name: '연어 (필렛)', category: '수산물', currentStock: 4, unit: 'kg', receivedDate: '2026-03-07', expiryDate: '2026-03-11', daysLeft: 3, storageLocation: '냉장 C', status: '주의' },
  { id: 4, name: '소고기 등심', category: '육류', currentStock: 12, unit: 'kg', receivedDate: '2026-03-06', expiryDate: '2026-03-14', daysLeft: 6, storageLocation: '냉동 1', status: '정상' },
  { id: 5, name: '두부', category: '기타', currentStock: 1, unit: '모', receivedDate: '2026-03-07', expiryDate: '2026-03-10', daysLeft: 2, storageLocation: '냉장 D', status: '부족' },
  { id: 6, name: '달걀', category: '기타', currentStock: 90, unit: '개', receivedDate: '2026-03-05', expiryDate: '2026-03-18', daysLeft: 10, storageLocation: '냉장 E', status: '정상' },
  { id: 7, name: '양파', category: '채소', currentStock: 2, unit: 'kg', receivedDate: '2026-03-04', expiryDate: '2026-03-12', daysLeft: 4, storageLocation: '실온 선반', status: '부족' },
  { id: 8, name: '올리브 오일', category: '조미료', currentStock: 5, unit: 'L', receivedDate: '2026-03-01', expiryDate: '2026-09-01', daysLeft: 177, storageLocation: '실온 선반', status: '정상' },
];

/* ───────── component ───────── */
const Ingredients = () => {
  const { toast } = useToast();

  /* prep state */
  const [preps, setPreps] = useState<PrepItem[]>(initialPreps);
  const [prepSearch, setPrepSearch] = useState('');
  const [prepAddOpen, setPrepAddOpen] = useState(false);
  const [prepDetail, setPrepDetail] = useState<PrepItem | null>(null);
  const [prepEdit, setPrepEdit] = useState<PrepItem | null>(null);
  const [prepForm, setPrepForm] = useState({ name: '', prepTime: '', assignee: '', quantity: '', unit: 'kg', useByHours: '8', storageLocation: '' });

  /* raw state */
  const [raws, setRaws] = useState<RawIngredient[]>(initialRaws);
  const [rawSearch, setRawSearch] = useState('');
  const [rawAddOpen, setRawAddOpen] = useState(false);
  const [rawDetail, setRawDetail] = useState<RawIngredient | null>(null);
  const [rawDeductOpen, setRawDeductOpen] = useState<RawIngredient | null>(null);
  const [deductQty, setDeductQty] = useState('');
  const [rawForm, setRawForm] = useState({ name: '', category: '육류', currentStock: '', unit: 'kg', expiryDate: '', storageLocation: '' });

  /* ── Prep helpers ── */
  const filteredPreps = preps.filter(p => p.name.includes(prepSearch) || p.assignee.includes(prepSearch));
  const prepPlanned = preps.filter(p => p.status === '제조 예정').length;
  const prepDone = preps.filter(p => p.status === '제조 완료').length;
  const prepExpiring = preps.filter(p => p.status === '제조 완료' && p.useByHours <= 2).length;
  const prepDispose = preps.filter(p => p.status === '제조 완료' && p.useByHours <= 0).length;

  const handleAddPrep = () => {
    if (!prepForm.name || !prepForm.assignee) { toast({ title: '입력 오류', description: '품목명과 담당자를 입력하세요.', variant: 'destructive' }); return; }
    const item: PrepItem = {
      id: Date.now(), name: prepForm.name, prepDate: today, prepTime: prepForm.prepTime || '00:00',
      assignee: prepForm.assignee, quantity: Number(prepForm.quantity) || 0, unit: prepForm.unit,
      useByDate: today, useByHours: Number(prepForm.useByHours) || 8, storageLocation: prepForm.storageLocation || '-', status: '제조 예정',
    };
    setPreps(prev => [...prev, item]);
    setPrepAddOpen(false);
    setPrepForm({ name: '', prepTime: '', assignee: '', quantity: '', unit: 'kg', useByHours: '8', storageLocation: '' });
    toast({ title: '등록 완료', description: `${item.name} 제조가 등록되었습니다.` });
  };

  const updatePrepStatus = (id: number, status: PrepItem['status']) => {
    setPreps(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    setPrepDetail(null);
    toast({ title: '상태 변경', description: `상태가 "${status}"(으)로 변경되었습니다.` });
  };

  /* ── Raw helpers ── */
  const filteredRaws = raws.filter(r => r.name.includes(rawSearch) || r.category.includes(rawSearch));
  const rawUrgent = raws.filter(r => r.daysLeft <= 1 && r.status !== '폐기').length;
  const rawCaution = raws.filter(r => r.daysLeft > 1 && r.daysLeft <= 3 && r.status !== '폐기').length;
  const rawLow = raws.filter(r => r.status === '부족').length;
  const rawNormal = raws.filter(r => r.status === '정상').length;

  const handleAddRaw = () => {
    if (!rawForm.name || !rawForm.expiryDate) { toast({ title: '입력 오류', description: '식재료명과 유통기한을 입력하세요.', variant: 'destructive' }); return; }
    const daysLeft = Math.ceil((new Date(rawForm.expiryDate).getTime() - Date.now()) / 86400000);
    const stock = Number(rawForm.currentStock) || 0;
    const status: RawIngredient['status'] = daysLeft <= 1 ? '긴급' : daysLeft <= 3 ? '주의' : stock <= 2 ? '부족' : '정상';
    const item: RawIngredient = {
      id: Date.now(), name: rawForm.name, category: rawForm.category, currentStock: stock, unit: rawForm.unit,
      receivedDate: today, expiryDate: rawForm.expiryDate, daysLeft, storageLocation: rawForm.storageLocation || '-', status,
    };
    setRaws(prev => [...prev, item]);
    setRawAddOpen(false);
    setRawForm({ name: '', category: '육류', currentStock: '', unit: 'kg', expiryDate: '', storageLocation: '' });
    toast({ title: '입고 완료', description: `${item.name}이(가) 입고 등록되었습니다.` });
  };

  const handleDeduct = () => {
    if (!rawDeductOpen || !deductQty) return;
    const qty = Number(deductQty);
    setRaws(prev => prev.map(r => {
      if (r.id !== rawDeductOpen.id) return r;
      const newStock = Math.max(0, r.currentStock - qty);
      return { ...r, currentStock: newStock, status: newStock <= 2 ? '부족' : r.status };
    }));
    toast({ title: '차감 완료', description: `${rawDeductOpen.name} ${qty}${rawDeductOpen.unit} 차감되었습니다.` });
    setRawDeductOpen(null);
    setDeductQty('');
  };

  const disposeRaw = (id: number) => {
    setRaws(prev => prev.map(r => r.id === id ? { ...r, status: '폐기' as const } : r));
    setRawDetail(null);
    toast({ title: '폐기 처리', description: '폐기 처리되었습니다.' });
  };

  /* ── status helpers ── */
  const prepStatusBadge = (s: PrepItem['status']) => {
    const map: Record<string, { status: 'info' | 'success' | 'default' | 'destructive'; label: string }> = {
      '제조 예정': { status: 'info', label: '제조 예정' },
      '제조 완료': { status: 'success', label: '제조 완료' },
      '사용 완료': { status: 'default', label: '사용 완료' },
      '폐기': { status: 'destructive', label: '폐기' },
    };
    return map[s] || { status: 'default' as const, label: s };
  };

  const rawStatusBadge = (s: RawIngredient['status']) => {
    const map: Record<string, { status: 'destructive' | 'warning' | 'info' | 'success' | 'default'; label: string }> = {
      '긴급': { status: 'destructive', label: '긴급' },
      '주의': { status: 'warning', label: '주의' },
      '부족': { status: 'info', label: '부족' },
      '정상': { status: 'success', label: '정상' },
      '폐기': { status: 'default', label: '폐기' },
    };
    return map[s] || { status: 'default' as const, label: s };
  };

  /* ───────── render ───────── */
  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">식재료 관리</h1>
        <p className="text-muted-foreground text-sm mt-1">제조 품목과 원재료 재고를 통합 관리합니다</p>
      </div>

      <Tabs defaultValue="prep" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="prep" className="gap-1.5"><ChefHat className="w-4 h-4" />제조 품목 관리</TabsTrigger>
          <TabsTrigger value="raw" className="gap-1.5"><Package className="w-4 h-4" />원재료/유통기한 관리</TabsTrigger>
        </TabsList>

        {/* ═══════ TAB 1: 제조 품목 ═══════ */}
        <TabsContent value="prep" className="space-y-4 mt-4">
          {/* KPI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-info">{prepPlanned}</p><p className="text-xs text-muted-foreground">오늘 제조 예정</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-success">{prepDone}</p><p className="text-xs text-muted-foreground">오늘 제조 완료</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-warning">{prepExpiring}</p><p className="text-xs text-muted-foreground">사용기한 임박</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-destructive">{prepDispose}</p><p className="text-xs text-muted-foreground">폐기 필요</p></CardContent></Card>
          </div>

          {/* toolbar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <ItemAutocomplete storeId={null} value={prepSearch} onChange={setPrepSearch} typeFilter="prep" placeholder="품목명, 약어코드, 담당자 검색..." allowQuickCreate={false} />
            </div>
            <Dialog open={prepAddOpen} onOpenChange={setPrepAddOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />제조 등록</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>제조 품목 등록</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <div><Label>품목명 *</Label><ItemAutocomplete storeId={null} value={prepForm.name} onChange={v => setPrepForm({ ...prepForm, name: v })} typeFilter="prep" placeholder="품목명, 약어코드로 검색..." allowQuickCreate={true} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>제조시간</Label><Input type="time" value={prepForm.prepTime} onChange={e => setPrepForm({ ...prepForm, prepTime: e.target.value })} /></div>
                    <div><Label>담당자 *</Label><Input value={prepForm.assignee} onChange={e => setPrepForm({ ...prepForm, assignee: e.target.value })} placeholder="예: 김주방" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label>수량</Label><Input type="number" value={prepForm.quantity} onChange={e => setPrepForm({ ...prepForm, quantity: e.target.value })} /></div>
                    <div><Label>단위</Label>
                      <Select value={prepForm.unit} onValueChange={v => setPrepForm({ ...prepForm, unit: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="kg">kg</SelectItem><SelectItem value="L">L</SelectItem><SelectItem value="개">개</SelectItem><SelectItem value="팩">팩</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div><Label>사용기한 (시간)</Label><Input type="number" value={prepForm.useByHours} onChange={e => setPrepForm({ ...prepForm, useByHours: e.target.value })} /></div>
                  </div>
                  <div><Label>보관 위치</Label><Input value={prepForm.storageLocation} onChange={e => setPrepForm({ ...prepForm, storageLocation: e.target.value })} placeholder="예: 냉장 1번" /></div>
                  <Button onClick={handleAddPrep} className="w-full">등록</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* list */}
          <Card>
            <CardHeader><CardTitle className="text-base">제조 품목 목록</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {filteredPreps.length === 0 ? (
                <EmptyState icon={ChefHat} title="제조 품목이 없습니다" description="오늘 제조할 품목을 등록하세요." action={<Button size="sm" onClick={() => setPrepAddOpen(true)}><Plus className="w-4 h-4 mr-1" />제조 등록</Button>} />
              ) : filteredPreps.map(item => {
                const badge = prepStatusBadge(item.status);
                return (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 rounded-lg px-2 transition-colors" onClick={() => setPrepDetail(item)}>
                    <div className="flex items-center gap-3 min-w-0">
                      {item.useByHours <= 2 && item.status === '제조 완료' && <AlertTriangle className="w-4 h-4 text-warning shrink-0" />}
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${item.status === '사용 완료' || item.status === '폐기' ? 'line-through text-muted-foreground' : ''}`}>{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.assignee} · {item.prepTime} · {item.quantity}{item.unit}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground hidden sm:inline">{item.storageLocation}</span>
                      <StatusBadge status={badge.status} label={badge.label} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* prep detail sheet */}
          <Sheet open={prepDetail !== null} onOpenChange={() => setPrepDetail(null)}>
            <SheetContent>
              <SheetHeader><SheetTitle>제조 품목 상세</SheetTitle></SheetHeader>
              {prepDetail && (
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    {[['품목명', prepDetail.name], ['제조일', prepDetail.prepDate], ['제조시간', prepDetail.prepTime], ['담당자', prepDetail.assignee], ['제조 수량', `${prepDetail.quantity} ${prepDetail.unit}`], ['사용기한', `${prepDetail.useByHours}시간`], ['보관 위치', prepDetail.storageLocation]].map(([l, v]) => (
                      <div key={l} className="flex justify-between"><span className="text-sm text-muted-foreground">{l}</span><span className="text-sm font-medium">{v}</span></div>
                    ))}
                    <div className="flex justify-between"><span className="text-sm text-muted-foreground">상태</span><StatusBadge {...prepStatusBadge(prepDetail.status)} /></div>
                  </div>
                  <div className="flex flex-col gap-2 pt-2">
                    {prepDetail.status === '제조 예정' && <Button className="w-full" onClick={() => updatePrepStatus(prepDetail.id, '제조 완료')}><CheckCircle className="w-4 h-4 mr-2" />제조 완료</Button>}
                    {prepDetail.status === '제조 완료' && (
                      <>
                        <Button className="w-full" onClick={() => updatePrepStatus(prepDetail.id, '사용 완료')}><CheckCircle className="w-4 h-4 mr-2" />사용 완료</Button>
                        <Button variant="destructive" className="w-full" onClick={() => updatePrepStatus(prepDetail.id, '폐기')}><Trash2 className="w-4 h-4 mr-2" />폐기 처리</Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </TabsContent>

        {/* ═══════ TAB 2: 원재료 ═══════ */}
        <TabsContent value="raw" className="space-y-4 mt-4">
          {/* KPI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-destructive">{rawUrgent}</p><p className="text-xs text-muted-foreground">긴급 (D-1)</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-warning">{rawCaution}</p><p className="text-xs text-muted-foreground">주의 (D-3)</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-info">{rawLow}</p><p className="text-xs text-muted-foreground">부족 재고</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-success">{rawNormal}</p><p className="text-xs text-muted-foreground">정상 재고</p></CardContent></Card>
          </div>

          {/* toolbar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="식재료명 또는 카테고리 검색..." className="pl-9" value={rawSearch} onChange={e => setRawSearch(e.target.value)} />
            </div>
            <Dialog open={rawAddOpen} onOpenChange={setRawAddOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />입고 등록</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>원재료 입고 등록</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <div><Label>식재료명 *</Label><Input value={rawForm.name} onChange={e => setRawForm({ ...rawForm, name: e.target.value })} placeholder="예: 닭가슴살" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>카테고리</Label>
                      <Select value={rawForm.category} onValueChange={v => setRawForm({ ...rawForm, category: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="육류">육류</SelectItem><SelectItem value="수산물">수산물</SelectItem><SelectItem value="유제품">유제품</SelectItem><SelectItem value="채소">채소</SelectItem><SelectItem value="조미료">조미료</SelectItem><SelectItem value="기타">기타</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div><Label>보관 위치</Label><Input value={rawForm.storageLocation} onChange={e => setRawForm({ ...rawForm, storageLocation: e.target.value })} placeholder="예: 냉장 A" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label>재고 수량</Label><Input type="number" value={rawForm.currentStock} onChange={e => setRawForm({ ...rawForm, currentStock: e.target.value })} /></div>
                    <div><Label>단위</Label>
                      <Select value={rawForm.unit} onValueChange={v => setRawForm({ ...rawForm, unit: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="kg">kg</SelectItem><SelectItem value="L">L</SelectItem><SelectItem value="개">개</SelectItem><SelectItem value="모">모</SelectItem><SelectItem value="팩">팩</SelectItem><SelectItem value="박스">박스</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div><Label>유통기한 *</Label><Input type="date" value={rawForm.expiryDate} onChange={e => setRawForm({ ...rawForm, expiryDate: e.target.value })} /></div>
                  </div>
                  <Button onClick={handleAddRaw} className="w-full">입고 등록</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* list */}
          <Card>
            <CardHeader><CardTitle className="text-base">원재료 목록</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {filteredRaws.length === 0 ? (
                <EmptyState icon={Package} title="원재료가 없습니다" description="입고된 원재료를 등록하세요." action={<Button size="sm" onClick={() => setRawAddOpen(true)}><Plus className="w-4 h-4 mr-1" />입고 등록</Button>} />
              ) : filteredRaws.map(item => {
                const badge = rawStatusBadge(item.status);
                return (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 rounded-lg px-2 transition-colors" onClick={() => setRawDetail(item)}>
                    <div className="flex items-center gap-3 min-w-0">
                      {item.daysLeft <= 1 && item.status !== '폐기' && <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />}
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${item.status === '폐기' ? 'line-through text-muted-foreground' : ''}`}>{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.category} · 재고 {item.currentStock}{item.unit} · {item.storageLocation}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground hidden sm:inline">D-{item.daysLeft}</span>
                      <StatusBadge status={badge.status} label={badge.label} />
                      {item.status !== '폐기' && (
                        <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); setRawDeductOpen(item); }}><MinusCircle className="w-3.5 h-3.5" /></Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* raw detail sheet */}
          <Sheet open={rawDetail !== null} onOpenChange={() => setRawDetail(null)}>
            <SheetContent>
              <SheetHeader><SheetTitle>원재료 상세</SheetTitle></SheetHeader>
              {rawDetail && (
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    {[['식재료명', rawDetail.name], ['카테고리', rawDetail.category], ['현재 재고', `${rawDetail.currentStock} ${rawDetail.unit}`], ['입고일', rawDetail.receivedDate], ['유통기한', rawDetail.expiryDate], ['보관 위치', rawDetail.storageLocation]].map(([l, v]) => (
                      <div key={l} className="flex justify-between"><span className="text-sm text-muted-foreground">{l}</span><span className="text-sm font-medium">{v}</span></div>
                    ))}
                    <div className="flex justify-between"><span className="text-sm text-muted-foreground">상태</span><StatusBadge {...rawStatusBadge(rawDetail.status)} /></div>
                  </div>
                  {rawDetail.status !== '폐기' && (
                    <div className="flex flex-col gap-2 pt-2">
                      <Button variant="outline" className="w-full" onClick={() => { setRawDeductOpen(rawDetail); setRawDetail(null); }}><MinusCircle className="w-4 h-4 mr-2" />재고 차감</Button>
                      <Button variant="destructive" className="w-full" onClick={() => disposeRaw(rawDetail.id)}><Trash2 className="w-4 h-4 mr-2" />폐기 처리</Button>
                    </div>
                  )}
                </div>
              )}
            </SheetContent>
          </Sheet>

          {/* deduct dialog */}
          <Dialog open={rawDeductOpen !== null} onOpenChange={() => { setRawDeductOpen(null); setDeductQty(''); }}>
            <DialogContent>
              <DialogHeader><DialogTitle>재고 차감</DialogTitle></DialogHeader>
              {rawDeductOpen && (
                <div className="space-y-3 pt-2">
                  <p className="text-sm">현재 재고: <span className="font-semibold">{rawDeductOpen.currentStock} {rawDeductOpen.unit}</span></p>
                  <div><Label>차감 수량 ({rawDeductOpen.unit})</Label><Input type="number" value={deductQty} onChange={e => setDeductQty(e.target.value)} placeholder="차감할 수량 입력" /></div>
                  <Button onClick={handleDeduct} className="w-full">차감 확인</Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Ingredients;
