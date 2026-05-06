import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Plus, Trash2, GripVertical, Save, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDocumentTemplate, useSaveTemplate } from '@/hooks/useDocuments';
import { useActiveVersion, useSaveVersion, useTemplateUsage } from '@/hooks/useTemplateVersions';
import type { DocumentBlock, DocumentSchema, FieldBlock, FieldType } from '@/lib/documentTypes';
import {
  extractVariableKeys,
  validateVariables,
  buildSampleContext,
  type SmartVariableConfig,
} from '@/lib/smartVariables';
import WizardStepper from '@/components/documents/WizardStepper';
import SmartVariableConfigPanel from '@/components/documents/SmartVariableConfig';
import SmartVariablePanel from '@/components/documents/SmartVariablePanel';
import TemplatePreview from '@/components/documents/TemplatePreview';

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text_input: '단답 입력',
  textarea: '장문 입력',
  date: '날짜',
  checkbox: '체크박스',
  dropdown: '드롭다운',
  signature: '서명',
};

const newId = () => Math.random().toString(36).slice(2, 10);

const STEPS = [
  { label: '기본 정보' },
  { label: '스마트변수 설정' },
  { label: '본문 편집' },
  { label: '미리보기' },
  { label: '저장' },
];

export default function DocumentBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id && id !== 'new';
  const { data: tpl } = useDocumentTemplate(isEdit ? id : undefined);
  const { data: activeVersion } = useActiveVersion(isEdit ? id : undefined);
  const { data: usage } = useTemplateUsage(isEdit ? id : undefined);
  const saveTpl = useSaveTemplate();
  const saveVersion = useSaveVersion();

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('계약서');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [blocks, setBlocks] = useState<DocumentBlock[]>([]);
  const [variables, setVariables] = useState<SmartVariableConfig[]>([]);

  const focusedBlockId = useRef<string | null>(null);
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | HTMLInputElement | null>>({});

  useEffect(() => {
    if (tpl) {
      setTitle(tpl.title);
      setCategory(tpl.category);
      setDescription(tpl.description ?? '');
      setStatus((tpl.status as any) ?? 'active');
    }
  }, [tpl]);

  useEffect(() => {
    if (activeVersion) {
      setBlocks(((activeVersion.template_schema as any)?.blocks ?? []) as DocumentBlock[]);
      const sv = (activeVersion.smart_variable_schema as any) ?? [];
      if (Array.isArray(sv)) setVariables(sv as SmartVariableConfig[]);
    } else if (tpl && !activeVersion) {
      setBlocks(((tpl.template_schema as any)?.blocks ?? []) as DocumentBlock[]);
    }
  }, [activeVersion, tpl]);

  // ===== block ops
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

  // ===== insert variable into focused text block
  const insertVariable = (key: string) => {
    const fid = focusedBlockId.current;
    if (!fid) {
      toast({ title: '본문 또는 제목 블록을 먼저 선택하세요', variant: 'destructive' });
      return;
    }
    const block = blocks.find((b) => b.id === fid);
    if (!block || (block.type !== 'heading' && block.type !== 'paragraph')) return;
    const el = textareaRefs.current[fid];
    const textBlock = block as any;
    const currentText = textBlock.text ?? '';
    let newText = currentText + key;
    if (el && typeof el.selectionStart === 'number') {
      const start = el.selectionStart ?? currentText.length;
      const end = el.selectionEnd ?? currentText.length;
      newText = currentText.slice(0, start) + key + currentText.slice(end);
    }
    updateBlock(fid, { text: newText } as any);
  };

  // ===== validation
  const usedKeys = useMemo(() => {
    const s = new Set<string>();
    for (const b of blocks) {
      if (b.type === 'heading' || b.type === 'paragraph') extractVariableKeys((b as any).text).forEach((k) => s.add(k));
    }
    return s;
  }, [blocks]);

  const bodyText = blocks.map((b) => (b.type === 'heading' || b.type === 'paragraph') ? (b as any).text : '').join('\n');
  const sampleCtx = useMemo(() => buildSampleContext(variables), [variables]);
  const validation = useMemo(() => validateVariables(bodyText, variables, sampleCtx), [bodyText, variables, sampleCtx]);

  // ===== save
  const handleSaveTemplate = async (asDraft = false) => {
    if (!title.trim()) { toast({ title: '제목을 입력하세요', variant: 'destructive' }); return; }
    try {
      const schema: DocumentSchema = { blocks };
      let templateId = isEdit ? id! : undefined;
      const saved = await saveTpl.mutateAsync({
        id: templateId,
        title,
        category,
        description,
        schema,
        status: asDraft ? 'draft' : status,
      });
      templateId = (saved as any).id;

      const result = await saveVersion.mutateAsync({
        templateId: templateId!,
        schema,
        variables,
      });

      if (result.isNewVersion && usage?.used) {
        toast({ title: `새 버전 v${result.versionNumber}로 저장되었습니다`, description: '이미 사용된 템플릿이라 새 버전으로 저장됩니다.' });
      } else {
        toast({ title: asDraft ? '임시저장되었습니다' : '템플릿이 저장되었습니다' });
      }
      navigate('/documents');
    } catch (e: any) {
      toast({ title: '저장 실패', description: e.message, variant: 'destructive' });
    }
  };

  const handleSendRequest = async () => {
    if (validation.missingRequired.length > 0) {
      toast({
        title: '필수 스마트변수를 설정해주세요.',
        description: validation.missingRequired.map((v) => v.display_name).join(', '),
        variant: 'destructive',
      });
      return;
    }
    if (validation.unconfiguredUsed.length > 0) {
      toast({
        title: '설정되지 않은 스마트변수가 있습니다.',
        description: validation.unconfiguredUsed.join(', '),
        variant: 'destructive',
      });
      return;
    }
    await handleSaveTemplate(false);
    if (isEdit) navigate(`/documents/send/${id}`);
  };

  // ===== step navigation
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/documents')}><ArrowLeft className="w-4 h-4" /></Button>
          <h1 className="text-2xl font-bold">{isEdit ? '템플릿 수정' : '새 전자문서 템플릿'}</h1>
          {isEdit && activeVersion && (
            <Badge variant="outline">v{(activeVersion as any).version_number}</Badge>
          )}
          {usage?.used && <Badge variant="outline" className="border-amber-500/40 text-amber-500">사용 중 ({usage.count}건)</Badge>}
        </div>
      </div>

      {usage?.used && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          이미 사용된 템플릿입니다. 수정 사항은 새 버전으로 저장됩니다.
        </div>
      )}

      <WizardStepper steps={STEPS} current={step} onStepClick={setStep} />

      {/* Step 1: Basic Info */}
      {step === 0 && (
        <Card>
          <CardContent className="p-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label>문서명 *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 근로계약서" />
            </div>
            <div className="space-y-1.5">
              <Label>문서 종류</Label>
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
            <div className="space-y-1.5">
              <Label>템플릿 상태</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">활성</SelectItem>
                  <SelectItem value="inactive">비활성</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>설명</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="템플릿 용도와 사용 대상을 간단히 설명하세요" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Smart Variables */}
      {step === 1 && (
        <SmartVariableConfigPanel variables={variables} onChange={setVariables} usedKeys={usedKeys} />
      )}

      {/* Step 3: Content Editor */}
      {step === 2 && (
        <div className="grid gap-4 md:grid-cols-[1fr,260px]">
          <div className="space-y-2">
            <Card>
              <CardContent className="p-3 flex flex-wrap gap-1">
                <Button variant="outline" size="sm" onClick={() => addBlock('heading')}>제목</Button>
                <Button variant="outline" size="sm" onClick={() => addBlock('paragraph')}>본문</Button>
                <Button variant="outline" size="sm" onClick={() => addBlock('divider')}>구분선</Button>
                <span className="w-px bg-border mx-1" />
                {(Object.keys(FIELD_TYPE_LABELS) as FieldType[]).map((ft) => (
                  <Button key={ft} variant="outline" size="sm" onClick={() => addField(ft)}>{FIELD_TYPE_LABELS[ft]}</Button>
                ))}
              </CardContent>
            </Card>

            {blocks.length === 0 && (
              <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">위에서 블록이나 필드를 추가하고, 우측 패널에서 스마트변수를 클릭해 본문에 삽입하세요.</CardContent></Card>
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
                    <Input
                      ref={(el) => { textareaRefs.current[b.id] = el; }}
                      value={(b as any).text}
                      onChange={(e) => updateBlock(b.id, { text: e.target.value } as any)}
                      onFocus={() => { focusedBlockId.current = b.id; }}
                    />
                  )}
                  {b.type === 'paragraph' && (
                    <Textarea
                      ref={(el) => { textareaRefs.current[b.id] = el; }}
                      value={(b as any).text}
                      onChange={(e) => updateBlock(b.id, { text: e.target.value } as any)}
                      onFocus={() => { focusedBlockId.current = b.id; }}
                      rows={4}
                    />
                  )}
                  {b.type === 'field' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2"><Label className="text-xs">라벨</Label><Input value={(b as any).label} onChange={(e) => updateBlock(b.id, { label: e.target.value } as any)} /></div>
                      {(b as any).fieldType !== 'signature' && (b as any).fieldType !== 'checkbox' && (
                        <div className="col-span-2"><Label className="text-xs">플레이스홀더</Label><Input value={(b as any).placeholder ?? ''} onChange={(e) => updateBlock(b.id, { placeholder: e.target.value } as any)} /></div>
                      )}
                      {(b as any).fieldType === 'dropdown' && (
                        <div className="col-span-2"><Label className="text-xs">옵션 (콤마 구분)</Label><Input value={((b as any).options ?? []).join(', ')} onChange={(e) => updateBlock(b.id, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) } as any)} /></div>
                      )}
                      <div className="flex items-center gap-2"><Switch checked={(b as any).required} onCheckedChange={(c) => updateBlock(b.id, { required: c } as any)} /><Label className="text-xs">필수</Label></div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <SmartVariablePanel configured={variables} onInsert={insertVariable} usedKeys={usedKeys} />
        </div>
      )}

      {/* Step 4: Preview */}
      {step === 3 && (
        <TemplatePreview schema={{ blocks }} variables={variables} title={title} />
      )}

      {/* Step 5: Save / Send */}
      {step === 4 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              {validation.ok ? (
                <><CheckCircle2 className="w-5 h-5 text-emerald-500" /><p className="font-medium">모든 스마트변수가 설정되었습니다.</p></>
              ) : (
                <><AlertCircle className="w-5 h-5 text-amber-500" /><p className="font-medium">설정을 확인해주세요</p></>
              )}
            </div>
            {validation.missingRequired.length > 0 && (
              <div className="text-sm text-destructive">
                <p className="font-medium">필수 변수 미설정:</p>
                <p>{validation.missingRequired.map((v) => v.display_name).join(', ')}</p>
              </div>
            )}
            {validation.unconfiguredUsed.length > 0 && (
              <div className="text-sm text-amber-500">
                <p className="font-medium">본문에 사용된 미설정 변수:</p>
                <p>{validation.unconfiguredUsed.join(', ')}</p>
                <p className="text-xs text-muted-foreground mt-1">2단계로 돌아가 변수를 추가하거나 본문에서 제거하세요.</p>
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-3 pt-4">
              <Button variant="outline" onClick={() => handleSaveTemplate(true)} disabled={saveTpl.isPending || saveVersion.isPending}>
                <Save className="w-4 h-4 mr-1" />임시저장
              </Button>
              <Button onClick={() => handleSaveTemplate(false)} disabled={saveTpl.isPending || saveVersion.isPending}>
                <Save className="w-4 h-4 mr-1" />템플릿 저장
              </Button>
              <Button variant="default" onClick={handleSendRequest} disabled={!validation.ok || saveTpl.isPending || saveVersion.isPending}>
                <Send className="w-4 h-4 mr-1" />서명 요청 보내기
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={prev} disabled={step === 0}><ArrowLeft className="w-4 h-4 mr-1" />이전</Button>
        <span className="text-xs text-muted-foreground">{step + 1} / {STEPS.length}</span>
        <Button onClick={next} disabled={step === STEPS.length - 1}>다음<ArrowRight className="w-4 h-4 ml-1" /></Button>
      </div>
    </div>
  );
}
