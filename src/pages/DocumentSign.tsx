import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useDocumentRequest, useAuditLogger, useMarkViewed } from '@/hooks/useDocuments';
import DocStatusBadge from '@/components/documents/DocStatusBadge';
import DocumentRenderer, { renderToHtml } from '@/components/documents/DocumentRenderer';
import { CONSENT_TEXT, CONSENT_VERSION, hashDocument, type DocumentSchema, type FieldBlock } from '@/lib/documentTypes';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export default function DocumentSign() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const { data: req, isLoading } = useDocumentRequest(id);
  const log = useAuditLogger();
  const markViewed = useMarkViewed();
  const qc = useQueryClient();

  const [values, setValues] = useState<Record<string, any>>({});
  const [signature, setSignature] = useState<{ method: 'draw' | 'typed'; dataUrl?: string; typedName?: string } | null>(null);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (req && id) {
      markViewed(id, req.status);
      log(id, 'viewed');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req?.id]);

  const rawSchema: any = req?.document_schema ?? { blocks: [] };
  const schema: DocumentSchema = { blocks: rawSchema.blocks ?? [] };
  const embeddedCtx: Record<string, string> = rawSchema.smartContext ?? {};
  const smartCtx: Record<string, string> = useMemo(() => ({
    회사명: '', 매장명: '', 직원명: profile?.full_name ?? '', 직급: profile?.position ?? '',
    휴대전화번호: profile?.phone ?? '', 입사일: profile?.hire_date ?? '', 근무장소: '',
    시급: '', 월급: '', 계약시작일: '', 계약종료일: '',
    작성일: new Date().toISOString().slice(0, 10),
    ...embeddedCtx,
  }), [profile, JSON.stringify(embeddedCtx)]);

  const fieldBlocks = schema.blocks.filter((b): b is FieldBlock => b.type === 'field' && b.assignedTo !== 'sender');
  const requiredFields = fieldBlocks.filter((b) => b.required && b.fieldType !== 'signature');
  const sigField = fieldBlocks.find((b) => b.fieldType === 'signature');

  const completedRequired = requiredFields.filter((b) => {
    const v = values[b.id];
    if (b.fieldType === 'checkbox') return !!v;
    return v !== undefined && v !== '' && v !== null;
  }).length;
  const progress = requiredFields.length > 0 ? Math.round((completedRequired / requiredFields.length) * 100) : 100;

  const canSubmit = consent && completedRequired === requiredFields.length && (!sigField || !!signature);

  const handleSubmit = async () => {
    if (!user || !req || !id) return;
    if (!canSubmit) {
      toast({ title: '필수 항목을 모두 입력해주세요', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      // 1. Save field values
      const valueRows = Object.entries(values).map(([field_id, value]) => ({
        request_id: id, field_id, value: value as any, filled_by: user.id,
      }));
      if (valueRows.length > 0) {
        const { error } = await supabase.from('document_field_values').upsert(valueRows, { onConflict: 'request_id,field_id' });
        if (error) throw error;
      }

      // 2. Upload signature image if drawn
      let signatureUrl: string | null = null;
      if (signature?.method === 'draw' && signature.dataUrl) {
        const blob = await (await fetch(signature.dataUrl)).blob();
        const path = `${user.id}/${id}-${Date.now()}.png`;
        const { error: upErr } = await supabase.storage.from('signatures').upload(path, blob, { contentType: 'image/png', upsert: true });
        if (upErr) throw upErr;
        signatureUrl = path;
      }

      // 3. Render final HTML + hash
      const finalHtml = renderToHtml(schema, smartCtx, values, signature);
      const hash = await hashDocument(finalHtml);

      // 4. Insert signature record
      if (signature) {
        const { error: sigErr } = await supabase.from('document_signatures').insert({
          request_id: id,
          signer_user_id: user.id,
          signer_name: profile?.full_name ?? '서명자',
          signature_method: signature.method,
          signature_image_url: signatureUrl,
          typed_name: signature.typedName ?? null,
          consent_accepted: true,
          consent_text: CONSENT_TEXT,
          consent_text_version: CONSENT_VERSION,
          consent_accepted_at: new Date().toISOString(),
          signed_at: new Date().toISOString(),
          user_agent: navigator.userAgent,
          document_version_hash: hash,
        });
        if (sigErr) throw sigErr;
      }

      // 5. Insert final document
      const { error: fdErr } = await supabase.from('final_documents').insert({
        request_id: id, final_html: finalHtml, document_hash: hash,
      });
      if (fdErr) throw fdErr;

      // 6. Update request status
      await supabase.from('document_requests').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', id);

      // 7. Audit
      await log(id, 'signed', { method: signature?.method });
      await log(id, 'final_created', { hash });

      // 8. Notify sender
      await supabase.from('notifications').insert({
        user_id: req.sender_user_id, type: 'document',
        title: '문서 서명이 완료되었습니다',
        message: `"${req.title}" 문서가 ${profile?.full_name ?? '직원'}에 의해 서명 완료되었습니다.`,
        related_entity_type: 'document_request', related_entity_id: id, created_by: user.id,
      });

      toast({ title: '전자서명이 완료되었습니다' });
      qc.invalidateQueries({ queryKey: ['doc-requests-received'] });
      navigate(`/documents/view/${id}`);
    } catch (e: any) {
      toast({ title: '전자서명 저장 중 문제가 발생했습니다', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <p className="text-sm text-muted-foreground p-4">로딩 중...</p>;
  if (!req) return <p className="text-sm text-muted-foreground p-4">문서를 찾을 수 없습니다.</p>;
  if (req.recipient_user_id !== user?.id) {
    return <p className="text-sm text-destructive p-4">문서 접근 권한이 없습니다.</p>;
  }
  if (req.status === 'completed' || req.status === 'cancelled') {
    return (
      <div className="p-4 space-y-3">
        <p className="text-sm">이미 처리된 문서입니다.</p>
        <Button onClick={() => navigate(`/documents/view/${id}`)}>상세 보기</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in max-w-2xl mx-auto pb-20">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/documents')}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-xl font-bold">{req.title}</h1>
            <p className="text-xs text-muted-foreground">{req.category} {req.due_date && `· 제출 기한: ${req.due_date}`}</p>
          </div>
        </div>
        <DocStatusBadge status={req.status} />
      </div>

      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">필수 항목 {completedRequired}/{requiredFields.length} 완료</p>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <DocumentRenderer
            schema={schema}
            smartCtx={smartCtx}
            values={values}
            onChange={(fid, v) => setValues((prev) => ({ ...prev, [fid]: v }))}
            onSignatureChange={setSignature}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-semibold">전자서명 동의</p>
          <p className="text-xs text-muted-foreground whitespace-pre-wrap">{CONSENT_TEXT}</p>
          <label className="flex items-start gap-2 cursor-pointer">
            <Checkbox checked={consent} onCheckedChange={(c) => setConsent(!!c)} />
            <span className="text-sm">위 내용을 모두 확인하였으며 전자서명에 동의합니다.</span>
          </label>
        </CardContent>
      </Card>

      <div className="sticky bottom-4 bg-background/80 backdrop-blur p-2 rounded-lg">
        <Button className="w-full" size="lg" disabled={!canSubmit || submitting} onClick={handleSubmit}>
          {submitting ? '제출 중...' : '제출 및 서명 완료'}
        </Button>
      </div>
    </div>
  );
}
