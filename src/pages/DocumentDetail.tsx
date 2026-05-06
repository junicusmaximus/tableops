import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, X, Send, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useIsManager } from '@/hooks/useUserRole';
import {
  useDocumentRequest, useFieldValues, useSignature, useFinalDocument, useAuditLogs, useCancelDocument,
} from '@/hooks/useDocuments';
import DocStatusBadge from '@/components/documents/DocStatusBadge';
import DocumentRenderer from '@/components/documents/DocumentRenderer';
import type { DocumentSchema } from '@/lib/documentTypes';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { supabase } from '@/integrations/supabase/client';

const EVENT_LABELS: Record<string, string> = {
  document_created: '문서 생성', sent: '서명 요청 전송', viewed: '문서 열람',
  signed: '서명 완료', final_created: '최종본 생성', cancelled: '취소됨',
  rejected: '반려', downloaded: '다운로드',
};

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isManager = useIsManager();
  const { data: profile } = useEmployeeProfile();
  const { data: req } = useDocumentRequest(id);
  const { data: fieldValues = [] } = useFieldValues(id);
  const { data: signature } = useSignature(id);
  const { data: finalDoc } = useFinalDocument(id);
  const { data: audit = [] } = useAuditLogs(id);
  const cancel = useCancelDocument();
  const [signedImageUrl, setSignedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (signature?.signature_image_url) {
        const { data } = await supabase.storage.from('signatures').createSignedUrl(signature.signature_image_url, 60 * 60);
        setSignedImageUrl(data?.signedUrl ?? null);
      }
    };
    load();
  }, [signature]);

  if (!req) return <p className="text-sm text-muted-foreground p-4">로딩 중...</p>;

  const rawSchema: any = req.document_schema ?? { blocks: [] };
  const schema: DocumentSchema = { blocks: rawSchema.blocks ?? [] };
  const embeddedCtx: Record<string, string> = rawSchema.smartContext ?? {};
  const valueMap: Record<string, any> = Object.fromEntries(fieldValues.map((v) => [v.field_id, v.value]));

  const smartCtx: Record<string, string> = {
    회사명: '', 매장명: '', 직원명: req.recipient_name, 직급: profile?.position ?? '',
    휴대전화번호: '', 입사일: '', 근무장소: '', 시급: '', 월급: '',
    계약시작일: '', 계약종료일: '', 작성일: req.completed_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    ...embeddedCtx,
  };

  const sigPreview = signature ? {
    method: signature.signature_method as 'draw' | 'typed',
    dataUrl: signedImageUrl ?? undefined,
    typedName: signature.typed_name ?? undefined,
  } : null;

  const handleCancel = async () => {
    if (!confirm('이 문서를 취소하시겠습니까?')) return;
    await cancel.mutateAsync(id!);
    toast({ title: '문서가 취소되었습니다' });
  };

  const handleDownload = () => {
    if (!finalDoc) return;
    const blob = new Blob([`<!doctype html><html><head><meta charset="utf-8"><title>${req.title}</title></head><body>${finalDoc.final_html}</body></html>`], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${req.title}.html`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/documents')}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-xl font-bold">{req.title}</h1>
            <p className="text-xs text-muted-foreground">{req.category}</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <DocStatusBadge status={req.status} />
          {finalDoc && <Button size="sm" variant="outline" onClick={handleDownload}><Download className="w-3.5 h-3.5 mr-1" />다운로드</Button>}
          {isManager && req.status !== 'completed' && req.status !== 'cancelled' && (
            <Button size="sm" variant="outline" onClick={handleCancel}><X className="w-3.5 h-3.5 mr-1" />취소</Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-4 grid gap-2 text-sm md:grid-cols-2">
          <div><span className="text-muted-foreground">수신자: </span>{req.recipient_name}</div>
          <div><span className="text-muted-foreground">발송일: </span>{req.sent_at ? new Date(req.sent_at).toLocaleString('ko-KR') : '-'}</div>
          <div><span className="text-muted-foreground">열람일: </span>{req.viewed_at ? new Date(req.viewed_at).toLocaleString('ko-KR') : '-'}</div>
          <div><span className="text-muted-foreground">완료일: </span>{req.completed_at ? new Date(req.completed_at).toLocaleString('ko-KR') : '-'}</div>
          <div><span className="text-muted-foreground">제출 기한: </span>{req.due_date ?? '-'}</div>
          {signature && <div><span className="text-muted-foreground">서명 방식: </span>{signature.signature_method === 'draw' ? '직접 그리기' : '이름 입력 서명'}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <DocumentRenderer schema={schema} smartCtx={smartCtx} values={valueMap} signaturePreview={sigPreview} readOnly />
        </CardContent>
      </Card>

      {signature && (
        <Card>
          <CardContent className="p-4 space-y-2 text-sm">
            <p className="font-semibold">동의 정보</p>
            <p className="text-xs text-muted-foreground">버전: {signature.consent_text_version}</p>
            <p className="text-xs text-muted-foreground">동의 시각: {new Date(signature.consent_accepted_at).toLocaleString('ko-KR')}</p>
            <p className="text-xs text-muted-foreground">문서 해시: <span className="font-mono break-all">{signature.document_version_hash}</span></p>
            {signature.user_agent && <p className="text-xs text-muted-foreground truncate">User-Agent: {signature.user_agent}</p>}
          </CardContent>
        </Card>
      )}

      {isManager && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="font-semibold flex items-center gap-1"><Activity className="w-4 h-4" />감사 이력</p>
            <div className="space-y-1.5">
              {audit.length === 0 && <p className="text-xs text-muted-foreground">이력이 없습니다.</p>}
              {audit.map((a) => (
                <div key={a.id} className="flex items-start gap-2 text-xs border-l-2 border-border pl-3 py-1">
                  <div className="flex-1">
                    <p><span className="font-medium">{EVENT_LABELS[a.event_type] ?? a.event_type}</span> · {a.actor_name} ({a.actor_role ?? '-'})</p>
                    <p className="text-muted-foreground">{new Date(a.created_at).toLocaleString('ko-KR')}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
