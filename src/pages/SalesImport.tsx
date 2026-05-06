import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useStoresForUser, useImportSales, type ImportRow } from '@/hooks/useSalesRecords';
import { useSalesPermissions } from '@/hooks/useSalesPermissions';

type Step = 'upload' | 'mapping' | 'preview' | 'done';

const FIELD_OPTIONS = [
  { value: 'business_date', label: '영업일 *' },
  { value: 'net_sales', label: '총 매출 *' },
  { value: 'payment_method', label: '결제수단' },
  { value: 'sales_channel', label: '판매채널' },
  { value: 'card_sales', label: '카드 매출' },
  { value: 'cash_sales', label: '현금 매출' },
  { value: 'delivery_sales', label: '배달 매출' },
  { value: 'alcohol_sales', label: '주류 매출' },
  { value: 'transaction_id', label: '거래ID' },
  { value: 'memo', label: '메모' },
  { value: 'ignore', label: '사용 안 함' },
];

const guessField = (header: string): string => {
  const h = header.toLowerCase();
  if (/(date|날짜|영업일)/.test(h)) return 'business_date';
  if (/(net|총매출|매출액|amount|sales)/.test(h) && !/카드|현금|배달|주류/.test(h)) return 'net_sales';
  if (/카드|card/.test(h)) return 'card_sales';
  if (/현금|cash/.test(h)) return 'cash_sales';
  if (/배달|delivery/.test(h)) return 'delivery_sales';
  if (/주류|alcohol/.test(h)) return 'alcohol_sales';
  if (/결제|payment/.test(h)) return 'payment_method';
  if (/채널|channel/.test(h)) return 'sales_channel';
  if (/거래|transaction|tid/.test(h)) return 'transaction_id';
  if (/메모|memo|note/.test(h)) return 'memo';
  return 'ignore';
};

const SalesImport = () => {
  const navigate = useNavigate();
  const perms = useSalesPermissions();
  const { data: stores = [] } = useStoresForUser();
  const importMut = useImportSales();

  const [step, setStep] = useState<Step>('upload');
  const [storeId, setStoreId] = useState('');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ imported: number; duplicates: number; total: number } | null>(null);

  if (!perms.canView) {
    return (
      <Card><CardContent className="py-16 text-center">
        <ShieldAlert className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
        <p>{perms.blockedReason ?? '매출 임포트 권한이 없습니다.'}</p>
      </CardContent></Card>
    );
  }

  const handleFile = async (file: File) => {
    setFileName(file.name);
    const isExcel = /\.(xlsx|xls)$/i.test(file.name);
    if (isExcel) {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
      finalizeParse(json);
    } else {
      Papa.parse<Record<string, any>>(file, {
        header: true, skipEmptyLines: true,
        complete: (res) => finalizeParse(res.data),
        error: () => toast.error('매출 데이터 형식이 올바르지 않습니다.'),
      });
    }
  };

  const finalizeParse = (rows: Record<string, any>[]) => {
    if (rows.length === 0) { toast.error('데이터가 비어 있습니다.'); return; }
    const hdrs = Object.keys(rows[0]);
    setHeaders(hdrs);
    setRawRows(rows);
    const m: Record<string, string> = {};
    hdrs.forEach((h) => { m[h] = guessField(h); });
    setMapping(m);
    setStep('mapping');
  };

  const previewRows: ImportRow[] = (() => {
    const inv = Object.entries(mapping).reduce((acc, [h, f]) => { if (f !== 'ignore') acc[f] = h; return acc; }, {} as Record<string, string>);
    return rawRows.map((r) => {
      const get = (f: string) => (inv[f] ? r[inv[f]] : undefined);
      const dRaw = get('business_date');
      const d = dRaw ? String(dRaw).slice(0, 10).replace(/\//g, '-') : '';
      return {
        business_date: d,
        net_sales: Number(String(get('net_sales') ?? 0).replace(/[,₩\s]/g, '')) || 0,
        payment_method: get('payment_method') ?? null,
        sales_channel: get('sales_channel') ?? null,
        card_sales: Number(String(get('card_sales') ?? 0).replace(/[,₩\s]/g, '')) || 0,
        cash_sales: Number(String(get('cash_sales') ?? 0).replace(/[,₩\s]/g, '')) || 0,
        delivery_sales: Number(String(get('delivery_sales') ?? 0).replace(/[,₩\s]/g, '')) || 0,
        alcohol_sales: Number(String(get('alcohol_sales') ?? 0).replace(/[,₩\s]/g, '')) || 0,
        transaction_id: get('transaction_id') ? String(get('transaction_id')) : null,
        memo: get('memo') ?? null,
      };
    });
  })();

  const validRows = previewRows.filter((r) => r.business_date && r.net_sales > 0);
  const invalidCount = previewRows.length - validRows.length;

  const handleImport = () => {
    if (!storeId) { toast.error('매장을 선택해주세요.'); return; }
    if (validRows.length === 0) { toast.error('가져올 유효한 행이 없습니다.'); return; }
    importMut.mutate({ storeId, rows: validRows, fileName }, {
      onSuccess: (res) => {
        setResult(res);
        setStep('done');
        toast.success(`매출 데이터 가져오기가 완료되었습니다. ${res.imported}건 추가, ${res.duplicates}건 중복.`);
      },
      onError: (e: any) => toast.error(e.message ?? '매출 데이터 가져오기에 실패했습니다.'),
    });
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/sales')}><ArrowLeft className="w-4 h-4" /></Button>
        <h1 className="text-2xl font-bold">매출 데이터 가져오기</h1>
      </div>

      {step === 'upload' && (
        <Card><CardHeader><CardTitle className="text-base">1단계 · 파일 업로드</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>매장 선택</Label>
              <Select value={storeId} onValueChange={setStoreId}>
                <SelectTrigger><SelectValue placeholder="매장 선택" /></SelectTrigger>
                <SelectContent>{stores.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-3">CSV 또는 Excel(.xlsx) 파일을 선택해주세요.</p>
              <Input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'mapping' && (
        <Card><CardHeader><CardTitle className="text-base">2단계 · 컬럼 매핑</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {headers.map((h) => (
              <div key={h} className="grid grid-cols-2 gap-2 items-center">
                <Label className="truncate">{h}</Label>
                <Select value={mapping[h]} onValueChange={(v) => setMapping((m) => ({ ...m, [h]: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FIELD_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('upload')}>이전</Button>
              <Button className="flex-1" onClick={() => setStep('preview')}>다음</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'preview' && (
        <Card><CardHeader><CardTitle className="text-base">3단계 · 미리보기 · 가져오기</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 text-sm">
              <Badge variant="outline">총 {previewRows.length}행</Badge>
              <Badge className="bg-emerald-500/15 text-emerald-500">유효 {validRows.length}건</Badge>
              {invalidCount > 0 && <Badge className="bg-destructive/15 text-destructive">제외 {invalidCount}건</Badge>}
            </div>
            <div className="border border-border rounded-lg overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 sticky top-0">
                  <tr><th className="p-2 text-left">영업일</th><th className="p-2 text-right">총 매출</th><th className="p-2 text-left">결제수단</th><th className="p-2 text-left">채널</th></tr>
                </thead>
                <tbody>
                  {previewRows.slice(0, 50).map((r, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="p-2">{r.business_date || <span className="text-destructive">없음</span>}</td>
                      <td className="p-2 text-right">{r.net_sales.toLocaleString()}</td>
                      <td className="p-2">{r.payment_method ?? '-'}</td>
                      <td className="p-2">{r.sales_channel ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">중복 거래는 자동으로 감지되어 제외됩니다.</p>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('mapping')}>이전</Button>
              <Button className="flex-1" onClick={handleImport} disabled={importMut.isPending}>가져오기 확정</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'done' && result && (
        <Card><CardContent className="py-10 text-center space-y-3">
          <p className="text-lg font-bold">매출 데이터를 업로드했습니다.</p>
          <p className="text-sm text-muted-foreground">{result.imported}건 추가 · {result.duplicates}건 중복 · {result.total}건 처리</p>
          <Button onClick={() => navigate('/sales')}>매출 분석으로 이동</Button>
        </CardContent></Card>
      )}
    </div>
  );
};

export default SalesImport;
