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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Trash2, Save, Users, FileQuestion } from 'lucide-react';
import {
  TRAINING_TYPES, useCourse, useCourseMutations, useArticles, useRecipes, useAssignmentMutations, useKnowledgePermissions,
} from '@/hooks/useKnowledge';
import { useStoreEmployees, useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { toast } from 'sonner';
import { SIGNUP_ROLES } from '@/hooks/useUserRole';

export default function CourseDetail() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const perms = useKnowledgePermissions();
  const { data } = useCourse(isNew ? undefined : id);
  const { create, update, remove, addItem, removeItem, addQuestion, removeQuestion } = useCourseMutations();

  const [editing, setEditing] = useState(isNew);
  const [form, setForm] = useState({
    title: '', description: '', training_type: '신입 직원 교육',
    target_roles: ['full_time','part_time'] as string[],
    required: false, due_days: 7, estimated_minutes: 30, status: 'draft',
    pass_threshold: 60, allow_quiz_retry: true,
  });

  useEffect(() => {
    if (data?.course) {
      const c = data.course;
      setForm({
        title: c.title, description: c.description || '', training_type: c.training_type,
        target_roles: c.target_roles, required: c.required, due_days: c.due_days || 7,
        estimated_minutes: c.estimated_minutes || 30, status: c.status,
        pass_threshold: c.pass_threshold, allow_quiz_retry: c.allow_quiz_retry,
      });
    }
  }, [data]);

  const save = async (publish = false) => {
    if (!form.title.trim()) { toast.error('필수 항목을 입력해주세요.'); return; }
    const payload = { ...form, status: publish ? 'published' : form.status };
    try {
      if (isNew) {
        const created = await create.mutateAsync(payload);
        toast.success('교육이 저장되었습니다.');
        navigate(`/knowledge/courses/${created.id}`);
      } else {
        await update.mutateAsync({ id: id!, ...payload });
        toast.success('교육이 저장되었습니다.');
        setEditing(false);
      }
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="container max-w-5xl py-6 space-y-4">
      <Button variant="ghost" size="sm" asChild><Link to="/knowledge"><ArrowLeft className="w-4 h-4 mr-1" />목록으로</Link></Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle>{isNew ? '교육 만들기' : (editing ? '교육 수정' : data?.course?.title)}</CardTitle>
            <div className="flex gap-2">
              {!isNew && data?.course && <AssignDialog courseId={data.course.id} />}
              {!isNew && !editing && perms.canManage && <Button variant="outline" size="sm" onClick={() => setEditing(true)}>수정</Button>}
              {!isNew && !editing && perms.canManage && (
                <Button variant="outline" size="sm" onClick={async () => {
                  if (!confirm('이 교육을 삭제하시겠습니까?')) return;
                  await remove.mutateAsync(id!); toast.success('삭제되었습니다.'); navigate('/knowledge');
                }}><Trash2 className="w-4 h-4" /></Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {editing ? (
            <>
              <Field label="교육명 *"><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
              <Field label="설명"><Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
              <div className="grid md:grid-cols-3 gap-3">
                <Field label="교육 유형">
                  <Select value={form.training_type} onValueChange={v => setForm({ ...form, training_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TRAINING_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="제출 기한 (일)"><Input type="number" value={form.due_days} onChange={e => setForm({ ...form, due_days: parseInt(e.target.value) || 0 })} /></Field>
                <Field label="예상 소요시간 (분)"><Input type="number" value={form.estimated_minutes} onChange={e => setForm({ ...form, estimated_minutes: parseInt(e.target.value) || 0 })} /></Field>
                <Field label="합격 기준 (점)"><Input type="number" value={form.pass_threshold} onChange={e => setForm({ ...form, pass_threshold: parseInt(e.target.value) || 0 })} /></Field>
              </div>
              <Field label="대상 직급">
                <div className="flex flex-wrap gap-3">
                  {SIGNUP_ROLES.map(r => (
                    <label key={r.value} className="flex items-center gap-1.5 text-sm">
                      <Checkbox checked={form.target_roles.includes(r.value)} onCheckedChange={c => setForm({ ...form,
                        target_roles: c ? [...form.target_roles, r.value] : form.target_roles.filter(x => x !== r.value)
                      })} />{r.label}
                    </label>
                  ))}
                </div>
              </Field>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <Label>필수 교육</Label>
                <Switch checked={form.required} onCheckedChange={v => setForm({ ...form, required: v })} />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <Label>퀴즈 재응시 허용</Label>
                <Switch checked={form.allow_quiz_retry} onCheckedChange={v => setForm({ ...form, allow_quiz_retry: v })} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={() => save(false)}><Save className="w-4 h-4 mr-1" />임시저장</Button>
                <Button onClick={() => save(true)}>게시하기</Button>
                {!isNew && <Button variant="outline" onClick={() => setEditing(false)}>취소</Button>}
              </div>
            </>
          ) : data?.course ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{data.course.training_type}</Badge>
                {data.course.required && <Badge variant="destructive">필수</Badge>}
                <Badge>{data.course.status === 'published' ? '게시됨' : '임시저장'}</Badge>
              </div>
              {data.course.description && <p className="text-sm text-muted-foreground">{data.course.description}</p>}
              <div className="grid md:grid-cols-4 gap-3 text-sm">
                <Info label="기한" value={`${data.course.due_days}일`} />
                <Info label="예상 소요" value={`${data.course.estimated_minutes}분`} />
                <Info label="합격 기준" value={`${data.course.pass_threshold}점`} />
                <Info label="재응시" value={data.course.allow_quiz_retry ? '허용' : '불가'} />
              </div>
            </>
          ) : <p className="text-sm text-muted-foreground">로딩 중...</p>}
        </CardContent>
      </Card>

      {!isNew && data && perms.canManage && (
        <>
          <CourseItemsSection courseId={id!} items={data.items} addItem={addItem} removeItem={removeItem} />
          <QuizQuestionsSection courseId={id!} questions={data.questions} addQuestion={addQuestion} removeQuestion={removeQuestion} />
        </>
      )}
    </div>
  );
}

function CourseItemsSection({ courseId, items, addItem, removeItem }: any) {
  const { data: articles = [] } = useArticles();
  const { data: recipes = [] } = useRecipes();
  const [type, setType] = useState<'manual' | 'recipe'>('manual');
  const [picked, setPicked] = useState('');

  const add = () => {
    if (!picked) return;
    const list = type === 'manual' ? articles : recipes;
    const item = list.find((x: any) => x.id === picked);
    addItem.mutate({ course_id: courseId, item_type: type, item_id: picked, title: item?.title, sort_order: items.length });
    setPicked('');
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">연결된 매뉴얼 / 레시피</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && <p className="text-sm text-muted-foreground">아직 연결된 항목이 없습니다.</p>}
        {items.map((it: any) => (
          <div key={it.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div><Badge variant="outline" className="mr-2">{it.item_type === 'manual' ? '매뉴얼' : '레시피'}</Badge>{it.title}</div>
            <Button variant="ghost" size="icon" onClick={() => removeItem.mutate({ id: it.id, course_id: courseId })}><Trash2 className="w-4 h-4" /></Button>
          </div>
        ))}
        <div className="flex gap-2">
          <Select value={type} onValueChange={v => { setType(v as any); setPicked(''); }}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="manual">매뉴얼</SelectItem><SelectItem value="recipe">레시피</SelectItem></SelectContent>
          </Select>
          <Select value={picked} onValueChange={setPicked}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="선택..." /></SelectTrigger>
            <SelectContent>
              {(type === 'manual' ? articles : recipes).map((x: any) => <SelectItem key={x.id} value={x.id}>{x.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={add} disabled={!picked}><Plus className="w-4 h-4" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}

function QuizQuestionsSection({ courseId, questions, addQuestion, removeQuestion }: any) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState({ question_type: 'multiple_choice', question: '', options: ['', '', '', ''], correct: 0, explanation: '', points: 10 });

  const submit = () => {
    if (!q.question.trim()) { toast.error('필수 항목을 입력해주세요.'); return; }
    let options: any = [], correct: any = null;
    if (q.question_type === 'multiple_choice') { options = q.options.filter(Boolean); correct = q.correct; }
    else if (q.question_type === 'ox') { options = ['O','X']; correct = q.correct; }
    else if (q.question_type === 'short_answer') { correct = q.options[0] || ''; }
    else if (q.question_type === 'checklist') { options = q.options.filter(Boolean); correct = []; }
    addQuestion.mutate({ course_id: courseId, question_type: q.question_type, question: q.question, options, correct_answer: correct, explanation: q.explanation, points: q.points, sort_order: questions.length });
    setOpen(false);
    setQ({ question_type: 'multiple_choice', question: '', options: ['', '', '', ''], correct: 0, explanation: '', points: 10 });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><FileQuestion className="w-4 h-4" />퀴즈 문항 ({questions.length})</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />문항 추가</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>퀴즈 문항 추가</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Select value={q.question_type} onValueChange={v => setQ({ ...q, question_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">객관식</SelectItem>
                    <SelectItem value="ox">O / X</SelectItem>
                    <SelectItem value="short_answer">단답형</SelectItem>
                    <SelectItem value="checklist">체크리스트</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea placeholder="문제" value={q.question} onChange={e => setQ({ ...q, question: e.target.value })} />
                {q.question_type === 'multiple_choice' && q.options.map((o, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="radio" checked={q.correct === i} onChange={() => setQ({ ...q, correct: i })} />
                    <Input placeholder={`보기 ${i+1}`} value={o} onChange={e => { const n = [...q.options]; n[i] = e.target.value; setQ({ ...q, options: n }); }} />
                  </div>
                ))}
                {q.question_type === 'ox' && (
                  <div className="flex gap-3">
                    <label className="flex items-center gap-1.5"><input type="radio" checked={q.correct === 0} onChange={() => setQ({ ...q, correct: 0 })} />정답: O</label>
                    <label className="flex items-center gap-1.5"><input type="radio" checked={q.correct === 1} onChange={() => setQ({ ...q, correct: 1 })} />정답: X</label>
                  </div>
                )}
                {q.question_type === 'short_answer' && (
                  <Input placeholder="정답" value={q.options[0]} onChange={e => { const n = [...q.options]; n[0] = e.target.value; setQ({ ...q, options: n }); }} />
                )}
                {q.question_type === 'checklist' && q.options.map((o, i) => (
                  <Input key={i} placeholder={`항목 ${i+1}`} value={o} onChange={e => { const n = [...q.options]; n[i] = e.target.value; setQ({ ...q, options: n }); }} />
                ))}
                <Textarea placeholder="해설 (선택)" value={q.explanation} onChange={e => setQ({ ...q, explanation: e.target.value })} />
                <Input type="number" placeholder="배점" value={q.points} onChange={e => setQ({ ...q, points: parseInt(e.target.value) || 0 })} />
                <Button onClick={submit} className="w-full">추가</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {questions.length === 0 && <p className="text-sm text-muted-foreground">문항이 없습니다.</p>}
        {questions.map((qq: any, i: number) => (
          <div key={qq.id} className="p-3 border border-border rounded-lg flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium">{i + 1}. {qq.question}</p>
              <p className="text-xs text-muted-foreground">{qq.question_type} · {qq.points}점</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => removeQuestion.mutate({ id: qq.id, course_id: courseId })}><Trash2 className="w-4 h-4" /></Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AssignDialog({ courseId }: { courseId: string }) {
  const [open, setOpen] = useState(false);
  const { data: profile } = useEmployeeProfile();
  const { data: employees = [] } = useStoreEmployees(profile?.store_id);
  const [picked, setPicked] = useState<string[]>([]);
  const [due, setDue] = useState('');
  const { assign } = useAssignmentMutations();

  const submit = async () => {
    const userIds = employees.filter((e: any) => picked.includes(e.id) && e.user_id).map((e: any) => e.user_id);
    if (userIds.length === 0) { toast.error('직원을 선택하세요.'); return; }
    try {
      await assign.mutateAsync({ courseId, userIds, dueDate: due || null });
      toast.success('교육이 배정되었습니다.');
      setOpen(false); setPicked([]); setDue('');
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Users className="w-4 h-4 mr-1" />교육 배정</Button></DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>직원에게 배정</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="제출 기한"><Input type="date" value={due} onChange={e => setDue(e.target.value)} /></Field>
          <Field label="대상 직원">
            <div className="max-h-64 overflow-y-auto space-y-1 border border-border rounded-lg p-2">
              {employees.length === 0 && <p className="text-xs text-muted-foreground p-2">매장에 등록된 직원이 없습니다.</p>}
              {employees.map((e: any) => (
                <label key={e.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer">
                  <Checkbox checked={picked.includes(e.id)} onCheckedChange={c => setPicked(c ? [...picked, e.id] : picked.filter(x => x !== e.id))} />
                  <span className="text-sm">{e.full_name}</span>
                  <Badge variant="outline" className="ml-auto text-[10px]">{e.position || '-'}</Badge>
                </label>
              ))}
            </div>
          </Field>
          <Button onClick={submit} className="w-full" disabled={assign.isPending}>배정하기</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-sm">{label}</Label>{children}</div>;
}
function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-muted-foreground">{label}</p><p>{value}</p></div>;
}
