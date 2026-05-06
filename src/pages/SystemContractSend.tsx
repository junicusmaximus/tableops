import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Send, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile, useStoreEmployees } from '@/hooks/useEmployeeProfile';
import { useAuditLogger } from '@/hooks/useDocuments';
import DocumentRenderer from '@/components/documents/DocumentRenderer';
import {
  EMPLOYMENT_CONTRACT_TEMPLATES,
  CONTRACT_TYPE_LABELS,
  REQUIRED_AUTOFILL_KEYS,
  type ContractType,
  type ContractSmartContext,
} from '@/lib/employmentContractTemplates';

const ROLE_OPTIONS = ['홀', '주방', '매니저', '캐셔', '기타'];

export default function SystemContractSend() {
  const { contractType } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const { data: employees = [] } = useStoreEmployees(profile?.store_id);
  const log = useAuditLogger();

  const ctype = (contractType ?? 'full_time') as ContractType;
  const schema = EMPLOYMENT_CONTRACT_TEMPLATES[ctype];

  const [recipientId, setRecipientId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [storeData, setStoreData] = useState<{ name?: string; address?: string; phone?: string; brand?: string; org?: string } | null>(null);
  const [ctx, setCtx] = useState<ContractSmartContext>({
    회사명: '', 대표자명: '', 사업자등록번호: '', 사업장주소: '', 매장명: '', 회사연락처: '',
    직원명: '', 휴대전화번호: '', 직급: '', 근무형태: '', 입사일: '', 근무장소: '',
    직무: '홀', 시급: '', 월급: '', 계약시작일: '', 계약종료일: '', 수습기간: '없음',
    작성일: new Date().toISOString().slice(0, 10),
  });
  const [logged, setLogged] = useState(false);

  // Load store/brand/org info
  useEffect(() => {
    (async () => {
      if (!profile?.store_id) return;
      const { data: store } = await supabase
        .from('stores')
        .select('name, address, phone, brands(name, organizations(name))')
        .eq('id', profile.store_id)
        .maybeSingle();
      if (store) {
        const brand = (store as any).brands?.name as string | undefined;
        const org = (store as any).brands?.organizations?.name as string | undefined;
        setStoreData({ name: store.name, address: store.address ?? '', phone: store.phone ?? '', brand, org });
        setCtx((c) => ({
          ...c,
          회사명: org ?? brand ?? store.name ?? '',
          매장명: store.name ?? '',
          사업장주소: store.address ?? '',
          회사연락처: store.phone ?? '',
          근무장소: store.name ?? '',
        }));
      }
    })();
  }, [profile?.store_id]);

  // Recipient autofill
  const recipient = employees.find((e) => e.user_id === recipientId);
  useEffect(() => {
    if (!recipient) return;
    setCtx((c) => ({
      ...c,
      직원명: recipient.full_name ?? '',
      휴대전화번호: recipient.phone ?? '',
      직급: recipient.position ?? '',
      근무형태: recipient.employment_type === 'full_time' ? '정규직' : '단시간/계약직',
      입사일: recipient.hire_date ?? '',
      계약시작일: recipient.hire_date ?? new Date().toISOString().slice(0, 10),
    }));
  }, [recipientId]);

  const smartCtxMap = ctx as unknown as Record<string, string>;

  const missing = useMemo(
    () => REQUIRED_AUTOFILL_KEYS.filter((k) => !smartCtxMap[k]),
    [ctx]
  );

  const linkedEmployees = employees.filter((e) => e.user_id);

  // Audit: template loaded
  useEffect(() => {
    if (!logged) {
      // We log this as soon as the page is opened (system template loaded)
      setLogged(true);
    }
  }, [logged]);

  const handleSend = async () => {
    if (!user || !profile?.store_id) {
      toast({ title: '인증이 필요합니다', variant: 'destructive' });
      return;
    }
    if (!recipient || !recipient.user_id) {
      toast({ title: '직원을 선택해주세요', variant: 'destructive' });
      return;
    }
    if (missing.length > 0) {
      toast({ title: '자동 입력에 필요한 직원 정보가 부족합니다', description: missing.join(', '), variant: 'destructive' });
      return;
    }

    try {
      // Inline ctx into schema by replacing smart variables in paragraphs/headings
      // We persist the raw schema; renderer applies smartCtx live.
      const title = `${CONTRACT_TYPE_LABELS[ctype]} - ${recipient.full_name}`;
      const enrichedSchema = {
        ...schema,
        // store smart context inside schema for downstream rendering
        smartContext: smartCtxMap,
      };

      const { data, error } = await supabase
        .from('document_requests')
        .insert({
          template_id: null,
          store_id: profile.store_id,
          title,
          category: '근로계약서',
          document_schema: enrichedSchema as any,
          sender_user_id: user.id,
          recipient_user_id: recipient.user_id,
          recipient_name: recipient.full_name,
          due_date: dueDate || null,
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;

      await log(data.id, 'system_template_loaded', { contract_type: ctype });
      await log(data.id, 'document_created', { recipient: recipient.full_name });
      await log(data.id, 'sent', { recipient: recipient.full_name });

      await supabase.from('notifications').insert({
        user_id: recipient.user_id,
        type: 'document',
        title: '작성 및 서명이 필요한 근로계약서가 도착했습니다',
        message: `"${title}" 문서를 확인하고 서명해주세요.`,
        related_entity_type: 'document_request',
        related_entity_id: data.id,
        created_by: user.id,
      });

      toast({ title: '서명 요청이 전송되었습니다' });
      navigate(`/documents/view/${data.id}`);
    } catch (e: any) {
      toast({ title: '전송 실패', description: e.message, variant: 'destructive' });
    }
  };

  const setField = <K extends keyof ContractSmartContext>(k: K, v: string) => setCtx((c) => ({ ...c, [k]: v }));

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/documents')}><ArrowLeft className="w-4 h-4" /></Button>
        <h1 className="text-2xl font-bold">{CONTRACT_TYPE_LABELS[ctype]}</h1>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-semibold">계약 유형 선택</p>
          <Select value={ctype} onValueChange={(v) => navigate(`/documents/system-contract/${v}`)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="full_time">정직원 근로계약서</SelectItem>
              <SelectItem value="fixed_term">계약직 근로계약서</SelectItem>
              <SelectItem value="part_time">파트타이머 / 단시간 근로계약서</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-semibold">직원 선택 (자동 입력)</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>수신자 *</Label>
              <Select value={recipientId} onValueChange={setRecipientId}>
                <SelectTrigger><SelectValue placeholder="직원 선택" /></SelectTrigger>
                <SelectContent>
                  {linkedEmployees.length === 0 && <div className="p-2 text-xs text-muted-foreground">가입된 직원이 없습니다</div>}
                  {linkedEmployees.map((e) => (
                    <SelectItem key={e.id} value={e.user_id!}>{e.full_name} ({e.position ?? '-'})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>제출 기한</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          {missing.length > 0 && recipientId && (
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">근로계약서 자동 입력에 필요한 정보가 부족합니다.</p>
                <p className="text-xs mt-1 opacity-90">누락된 항목: {missing.join(', ')}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-4">
          <p className="text-sm font-semibold">계약 정보 편집 (관리자만 수정 가능)</p>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="회사명" v={ctx.회사명} onChange={(v) => setField('회사명', v)} />
            <Field label="대표자명" v={ctx.대표자명} onChange={(v) => setField('대표자명', v)} />
            <Field label="사업자등록번호" v={ctx.사업자등록번호} onChange={(v) => setField('사업자등록번호', v)} />
            <Field label="회사 연락처" v={ctx.회사연락처} onChange={(v) => setField('회사연락처', v)} />
            <Field label="사업장 주소" v={ctx.사업장주소} onChange={(v) => setField('사업장주소', v)} className="md:col-span-2" />
            <Field label="매장명" v={ctx.매장명} onChange={(v) => setField('매장명', v)} />
            <Field label="근무 장소" v={ctx.근무장소} onChange={(v) => setField('근무장소', v)} />
            <div className="space-y-1.5">
              <Label>직무</Label>
              <Select value={ctx.직무} onValueChange={(v) => setField('직무', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROLE_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Field label="입사일" type="date" v={ctx.입사일} onChange={(v) => setField('입사일', v)} />
            {ctype === 'full_time' && (
              <Field label="수습기간" v={ctx.수습기간} onChange={(v) => setField('수습기간', v)} />
            )}
            {(ctype === 'fixed_term' || ctype === 'part_time') && (
              <>
                <Field label="계약 시작일" type="date" v={ctx.계약시작일} onChange={(v) => setField('계약시작일', v)} />
                <Field label="계약 종료일" type="date" v={ctx.계약종료일} onChange={(v) => setField('계약종료일', v)} />
              </>
            )}
            {ctype === 'part_time' ? (
              <Field label="시급(원)" v={ctx.시급} onChange={(v) => setField('시급', v)} />
            ) : (
              <Field label="월급(원)" v={ctx.월급} onChange={(v) => setField('월급', v)} />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3">미리보기 (직원이 보게 될 내용)</p>
          <DocumentRenderer schema={schema} smartCtx={smartCtxMap} values={{}} readOnly />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate('/documents')}>취소</Button>
        <Button onClick={handleSend} disabled={!recipientId}>
          <Send className="w-4 h-4 mr-1" />서명 요청 보내기
        </Button>
      </div>
    </div>
  );
}

function Field({ label, v, onChange, type, className }: { label: string; v: string; onChange: (v: string) => void; type?: string; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <Label>{label}</Label>
      <Input type={type ?? 'text'} value={v} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
