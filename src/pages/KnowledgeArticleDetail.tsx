import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, Save, FileCheck2 } from 'lucide-react';
import {
  ARTICLE_CATEGORIES, useArticle, useArticleMutations, useAcknowledgeArticle, useAcknowledgements, useKnowledgePermissions,
} from '@/hooks/useKnowledge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { SIGNUP_ROLES } from '@/hooks/useUserRole';

const IMPORTANCE = [{ v: 'low', l: '낮음' }, { v: 'normal', l: '보통' }, { v: 'high', l: '높음' }, { v: 'critical', l: '중요' }];

export default function ArticleDetail() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const { user } = useAuth();
  const perms = useKnowledgePermissions();
  const { data: article } = useArticle(isNew ? undefined : id);
  const { create, update, remove } = useArticleMutations();
  const ack = useAcknowledgeArticle();
  const { data: acks = [] } = useAcknowledgements(isNew ? undefined : id);

  const [editing, setEditing] = useState(isNew);
  const [form, setForm] = useState({
    title: '', category: '기타', summary: '', importance: 'normal',
    target_roles: ['ceo','owner','boss','manager','full_time','part_time'] as string[],
    require_acknowledgement: false, status: 'draft',
    steps: [''] as string[],
  });

  useEffect(() => {
    if (article) {
      setForm({
        title: article.title,
        category: article.category,
        summary: article.summary || '',
        importance: article.importance,
        target_roles: article.target_roles,
        require_acknowledgement: article.require_acknowledgement,
        status: article.status,
        steps: (article.content as any)?.steps || [''],
      });
    }
  }, [article]);

  const haveAcked = acks.some((a: any) => a.user_id === user?.id && a.article_version === article?.version);
  const canEdit = perms.canManage && (isNew || article?.created_by === user?.id || perms.canManage);

  const save = async (publish = false) => {
    if (!form.title.trim()) { toast.error('필수 항목을 입력해주세요.'); return; }
    const payload = {
      title: form.title, category: form.category, summary: form.summary,
      importance: form.importance, target_roles: form.target_roles,
      require_acknowledgement: form.require_acknowledgement,
      status: publish ? 'published' : form.status,
      content: { steps: form.steps.filter(Boolean) },
    };
    try {
      if (isNew) {
        const created = await create.mutateAsync(payload);
        toast.success('매뉴얼이 저장되었습니다.');
        navigate(`/knowledge/articles/${created.id}`);
      } else {
        await update.mutateAsync({ id: id!, ...payload, bumpVersion: publish && article?.status === 'published' });
        toast.success('매뉴얼이 저장되었습니다.');
        setEditing(false);
      }
    } catch (e: any) { toast.error(e.message || '저장 실패'); }
  };

  const handleAck = async () => {
    if (!article) return;
    try {
      await ack.mutateAsync({ articleId: article.id, version: article.version });
      toast.success('확인이 기록되었습니다.');
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="container max-w-4xl py-6 space-y-4">
      <Button variant="ghost" size="sm" asChild><Link to="/knowledge"><ArrowLeft className="w-4 h-4 mr-1" />목록으로</Link></Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle>{isNew ? '새 매뉴얼 작성' : (editing ? '매뉴얼 수정' : article?.title)}</CardTitle>
            <div className="flex gap-2">
              {!isNew && !editing && canEdit && <Button variant="outline" size="sm" onClick={() => setEditing(true)}>수정</Button>}
              {!isNew && !editing && canEdit && (
                <Button variant="outline" size="sm" onClick={async () => {
                  if (!confirm('이 매뉴얼을 삭제하시겠습니까?')) return;
                  await remove.mutateAsync(id!); toast.success('삭제되었습니다.'); navigate('/knowledge');
                }}><Trash2 className="w-4 h-4" /></Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {editing ? (
            <>
              <Field label="제목 *">
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </Field>
              <div className="grid md:grid-cols-2 gap-3">
                <Field label="카테고리">
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ARTICLE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="중요도">
                  <Select value={form.importance} onValueChange={(v) => setForm({ ...form, importance: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{IMPORTANCE.map((i) => <SelectItem key={i.v} value={i.v}>{i.l}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="요약">
                <Textarea rows={2} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
              </Field>
              <Field label="대상 직급">
                <div className="flex flex-wrap gap-3">
                  {SIGNUP_ROLES.map((r) => (
                    <label key={r.value} className="flex items-center gap-1.5 text-sm">
                      <Checkbox
                        checked={form.target_roles.includes(r.value)}
                        onCheckedChange={(c) => setForm({ ...form,
                          target_roles: c ? [...form.target_roles, r.value] : form.target_roles.filter(x => x !== r.value)
                        })}
                      />{r.label}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="단계별 절차">
                <div className="space-y-2">
                  {form.steps.map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="w-8 h-10 flex items-center justify-center text-sm text-muted-foreground">{i + 1}.</span>
                      <Textarea rows={2} value={s} onChange={(e) => {
                        const next = [...form.steps]; next[i] = e.target.value; setForm({ ...form, steps: next });
                      }} />
                      <Button variant="ghost" size="icon" onClick={() => setForm({ ...form, steps: form.steps.filter((_, x) => x !== i) })}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setForm({ ...form, steps: [...form.steps, ''] })}><Plus className="w-4 h-4 mr-1" />단계 추가</Button>
                </div>
              </Field>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <Label className="text-sm font-medium">확인서명 필수</Label>
                  <p className="text-xs text-muted-foreground">중요한 매뉴얼은 직원이 확인 서명해야 합니다.</p>
                </div>
                <Switch checked={form.require_acknowledgement} onCheckedChange={(v) => setForm({ ...form, require_acknowledgement: v })} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={() => save(false)}><Save className="w-4 h-4 mr-1" />임시저장</Button>
                <Button onClick={() => save(true)}>게시하기</Button>
                {!isNew && <Button variant="outline" onClick={() => setEditing(false)}>취소</Button>}
              </div>
            </>
          ) : article ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{article.category}</Badge>
                <Badge>{article.status === 'published' ? '게시됨' : article.status === 'archived' ? '보관됨' : '임시저장'}</Badge>
                {article.importance === 'critical' && <Badge variant="destructive">중요</Badge>}
                <Badge variant="outline">v{article.version}</Badge>
              </div>
              {article.summary && <p className="text-sm text-muted-foreground">{article.summary}</p>}
              <div className="space-y-3">
                <h3 className="font-semibold">단계별 절차</h3>
                <ol className="space-y-2 list-decimal pl-5">
                  {((article.content as any)?.steps || []).map((s: string, i: number) => (
                    <li key={i} className="text-sm leading-relaxed whitespace-pre-wrap">{s}</li>
                  ))}
                </ol>
              </div>
              {article.require_acknowledgement && (
                <div className="border border-amber-500/40 bg-amber-500/5 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2"><FileCheck2 className="w-4 h-4 text-amber-500" />
                    <p className="text-sm font-medium">확인 서명이 필요합니다</p></div>
                  <p className="text-sm text-muted-foreground">"본인은 해당 업무 매뉴얼을 확인하고 숙지하였습니다."</p>
                  {haveAcked
                    ? <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">확인 완료</Badge>
                    : <Button onClick={handleAck} disabled={ack.isPending}>확인했습니다</Button>}
                </div>
              )}
              {perms.canManage && acks.length > 0 && (
                <div className="border border-border rounded-lg p-3">
                  <p className="text-xs font-medium mb-2">확인 서명 기록 ({acks.length}건)</p>
                  <p className="text-xs text-muted-foreground">최근: {new Date(acks[0].acknowledged_at).toLocaleString('ko-KR')}</p>
                </div>
              )}
            </>
          ) : <p className="text-sm text-muted-foreground">로딩 중...</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-sm">{label}</Label>{children}</div>;
}
