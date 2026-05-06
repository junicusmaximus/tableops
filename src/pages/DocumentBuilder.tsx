import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Trash2, GripVertical, Save, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDocumentTemplate, useSaveTemplate } from '@/hooks/useDocuments';
import type { DocumentBlock, DocumentSchema, FieldBlock, FieldType } from '@/lib/documentTypes';
import { SMART_VARIABLES } from '@/lib/documentTypes';
import DocumentRenderer from '@/components/documents/DocumentRenderer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text_input: '단답 입력',
  textarea: '장문 입력',
  date: '날짜',
  checkbox: '체크박스',
  dropdown: '드롭다운',
  signature: '서명',
};

const newId = () => Math.random().toString(36).slice(2, 10);

export default function DocumentBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id && id !== 'new';
  const { data: tpl } = useDocumentTemplate(isEdit ? id : undefined);
  const save = useSaveTemplate();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('계약서');
  const [description, setDescription] = useState('');
  const [blocks, setBlocks] = useState<DocumentBlock[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (tpl) {
      setTitle(tpl.title);
      setCategory(tpl.category);
      setDescription(tpl.description ?? '');
      setBlocks(((tpl.template_schema as any)?.blocks ?? []) as DocumentBlock[]);
    }
  }, [tpl]);

  const addBlock = (type: 'heading' | 'paragraph' | 'divider') => {
    if (type === 'divider') setBlocks([...blocks, { id: newId(), type: 'divider' }]);
    else setBlocks([...blocks, { id: newId(), type, text: type === 'heading' ? '제목' : '내용을 입력하세요', level: type === 'heading' ? 2 : undefined } as any]);
  };
  const addField = (fieldType: FieldType) => {
    const f: FieldBlock = {
      id: newId(),
      type: 'field',
      fieldType,
      label: FIELD_TYPE_LABELS[fieldType],
      required: false,
      assignedTo: 'recipient',
      ...(fieldType === 'dropdown' ? { options: ['옵션 1', '옵션 2'] } : {}),
    };
    setBlocks([...blocks, f]);
  };
  const updateBlock = (id: string, patch: Partial<DocumentBlock>) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, ...patch } as DocumentBlock : b)));
  };
  const removeBlock = (id: string) => setBlocks(blocks.filter((b) => b.id !== id));
  const move = (id: string, dir: -1 | 1) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const next = [...blocks];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= blocks.length) return;
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    setBlocks(next);
  };

  const handleSave = async () => {
    if (!title.trim()) { toast({ title: '제목을 입력하세요', variant: 'destructive' }); return; }
    try {
      const schema: DocumentSchema = { blocks };
      await save.mutateAsync({ id: isEdit ? id : undefined, title, category, description, schema });
      toast({ title: '전자문서가 저장되었습니다' });
      navigate('/documents');
    } catch (e: any) {
      toast({ title: '저장 실패', description: e.message, variant: 'destructive' });
    }
  };

  const previewSchema: DocumentSchema = { blocks };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/documents')}><ArrowLeft className="w-4 h-4" /></Button>
          <h1 className="text-2xl font-bold">{isEdit ? '템플릿 편집' : '새 템플릿'}</h1>
        </div>
        <div className="flex gap-2">
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Eye className="w-4 h-4 mr-1" />미리보기</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{title || '미리보기'}</DialogTitle></DialogHeader>
              <DocumentRenderer schema={previewSchema} smartCtx={Object.fromEntries(SMART_VARIABLES.map((v) => [v.replace(/[{}]/g, ''), `[${v}]`]))} values={{}} readOnly />
            </DialogContent>
          </Dialog>
          <Button onClick={handleSave} disabled={save.isPending}><Save className="w-4 h-4 mr-1" />저장</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 grid gap-3 md:grid-cols-3">
          <div className="space-y-1.5"><Label>제목 *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 근로계약서" /></div>
          <div className="space-y-1.5">
            <Label>분류</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="계약서">계약서</SelectItem>
                <SelectItem value="동의서">동의서</SelectItem>
                <SelectItem value="확인서">확인서</SelectItem>
                <SelectItem value="신청서">신청서</SelectItem>
                <SelectItem value="기타">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>설명</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="간단 설명" /></div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-[200px,1fr]">
        <Card>
          <CardContent className="p-3 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground">블록 추가</p>
            <div className="grid grid-cols-1 gap-1">
              <Button variant="outline" size="sm" onClick={() => addBlock('heading')}>제목</Button>
              <Button variant="outline" size="sm" onClick={() => addBlock('paragraph')}>본문</Button>
              <Button variant="outline" size="sm" onClick={() => addBlock('divider')}>구분선</Button>
            </div>
            <p className="text-xs font-semibold text-muted-foreground pt-2">필드 추가</p>
            <div className="grid grid-cols-1 gap-1">
              {(Object.keys(FIELD_TYPE_LABELS) as FieldType[]).map((ft) => (
                <Button key={ft} variant="outline" size="sm" onClick={() => addField(ft)}>{FIELD_TYPE_LABELS[ft]}</Button>
              ))}
            </div>
            <p className="text-xs font-semibold text-muted-foreground pt-2">스마트 변수</p>
            <div className="text-xs text-muted-foreground space-y-0.5">
              {SMART_VARIABLES.map((v) => <div key={v} className="font-mono">{v}</div>)}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {blocks.length === 0 && (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">왼쪽에서 블록이나 필드를 추가하세요.</CardContent></Card>
          )}
          {blocks.map((b, i) => (
            <Card key={b.id}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <GripVertical className="w-3.5 h-3.5" />
                    <span className="font-medium">
                      {b.type === 'field' ? FIELD_TYPE_LABELS[b.fieldType] : b.type === 'heading' ? '제목' : b.type === 'paragraph' ? '본문' : '구분선'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" disabled={i === 0} onClick={() => move(b.id, -1)}>↑</Button>
                    <Button size="sm" variant="ghost" disabled={i === blocks.length - 1} onClick={() => move(b.id, 1)}>↓</Button>
                    <Button size="sm" variant="ghost" onClick={() => removeBlock(b.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
                {b.type === 'heading' && (
                  <Input value={b.text} onChange={(e) => updateBlock(b.id, { text: e.target.value } as any)} />
                )}
                {b.type === 'paragraph' && (
                  <Textarea value={b.text} onChange={(e) => updateBlock(b.id, { text: e.target.value } as any)} rows={3} />
                )}
                {b.type === 'field' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2"><Label className="text-xs">라벨</Label><Input value={b.label} onChange={(e) => updateBlock(b.id, { label: e.target.value } as any)} /></div>
                    {b.fieldType !== 'signature' && b.fieldType !== 'checkbox' && (
                      <div className="col-span-2"><Label className="text-xs">플레이스홀더</Label><Input value={b.placeholder ?? ''} onChange={(e) => updateBlock(b.id, { placeholder: e.target.value } as any)} /></div>
                    )}
                    {b.fieldType === 'dropdown' && (
                      <div className="col-span-2"><Label className="text-xs">옵션 (콤마 구분)</Label><Input value={(b.options ?? []).join(', ')} onChange={(e) => updateBlock(b.id, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) } as any)} /></div>
                    )}
                    <div className="flex items-center gap-2"><Switch checked={b.required} onCheckedChange={(c) => updateBlock(b.id, { required: c } as any)} /><Label className="text-xs">필수</Label></div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
