import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDocumentTemplate, useSendDocument } from '@/hooks/useDocuments';
import { useEmployeeProfile, useStoreEmployees } from '@/hooks/useEmployeeProfile';
import DocumentRenderer from '@/components/documents/DocumentRenderer';
import type { DocumentSchema } from '@/lib/documentTypes';
import { SMART_VARIABLES } from '@/lib/documentTypes';

export default function DocumentSend() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: tpl } = useDocumentTemplate(templateId);
  const { data: profile } = useEmployeeProfile();
  const { data: employees = [] } = useStoreEmployees(profile?.store_id);
  const sendMut = useSendDocument();

  const [recipientId, setRecipientId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const recipient = employees.find((e) => e.user_id === recipientId);
  const schema: DocumentSchema = (tpl?.template_schema as any) ?? { blocks: [] };

  const smartCtx: Record<string, string> = {
    회사명: '',
    매장명: '',
    직원명: recipient?.full_name ?? '',
    직급: recipient?.position ?? '',
    휴대전화번호: recipient?.phone ?? '',
    입사일: recipient?.hire_date ?? '',
    근무장소: '',
    시급: '',
    월급: '',
    계약시작일: '',
    계약종료일: '',
    작성일: new Date().toISOString().slice(0, 10),
  };

  const missingVars = SMART_VARIABLES.filter((v) => {
    const key = v.replace(/[{}]/g, '');
    const usedInTpl = JSON.stringify(schema).includes(v);
    return usedInTpl && !smartCtx[key];
  });

  const handleSend = async () => {
    if (!recipient || !recipient.user_id) {
      toast({ title: '수신자를 선택하세요', variant: 'destructive' });
      return;
    }
    try {
      const data = await sendMut.mutateAsync({
        template_id: templateId!,
        title: tpl!.title,
        category: tpl!.category,
        schema,
        recipient_user_id: recipient.user_id,
        recipient_name: recipient.full_name,
        due_date: dueDate || null,
      });
      toast({ title: '서명 요청이 전송되었습니다' });
      navigate(`/documents/view/${data.id}`);
    } catch (e: any) {
      toast({ title: '전송 실패', description: e.message, variant: 'destructive' });
    }
  };

  if (!tpl) return <p className="text-sm text-muted-foreground p-4">로딩 중...</p>;

  const linkedEmployees = employees.filter((e) => e.user_id);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/documents')}><ArrowLeft className="w-4 h-4" /></Button>
        <h1 className="text-2xl font-bold">문서 발송</h1>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="font-medium">{tpl.title}</p>
          <p className="text-xs text-muted-foreground">{tpl.category} · {tpl.description}</p>

          <div className="grid gap-3 md:grid-cols-2 pt-2">
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

          {missingVars.length > 0 && (
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
              자동 입력에 필요한 정보가 부족합니다: {missingVars.join(', ')}
              <p className="text-xs mt-1 opacity-80">직원 프로필에서 누락된 정보를 채워주세요. 비어있는 변수는 직원이 직접 입력하게 됩니다.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3">미리보기</p>
          <DocumentRenderer schema={schema} smartCtx={smartCtx} values={{}} readOnly />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate('/documents')}>취소</Button>
        <Button onClick={handleSend} disabled={sendMut.isPending || !recipientId}>
          <Send className="w-4 h-4 mr-1" />서명 요청 보내기
        </Button>
      </div>
    </div>
  );
}
