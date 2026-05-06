import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { RECIPE_CATEGORIES, ALLERGENS, useRecipe, useRecipeMutations, useKnowledgePermissions } from '@/hooks/useKnowledge';
import { toast } from 'sonner';

const VISIBILITY = [{ v: 'all', l: '전체 직원' }, { v: 'full_time', l: '정직원 이상' }, { v: 'manager_only', l: '매니저 이상' }];

export default function RecipeDetail() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const perms = useKnowledgePermissions();
  const { data } = useRecipe(isNew ? undefined : id);
  const { create, update, remove } = useRecipeMutations();
  const [editing, setEditing] = useState(isNew);
  const [form, setForm] = useState({
    title: '', english_name: '', category: '메인 메뉴', description: '',
    serving_size: '', batch_size: '', cook_time: '',
    storage_method: '', expiry_rule: '', plating_guide: '', warnings: '',
    photo_url: '', video_url: '', visibility_scope: 'all', status: 'draft',
    allergy_info: [] as string[],
    cook_steps: [''] as string[],
    cost_info: { material_cost: '', sale_price: '', supplier: '' },
    ingredients: [{ ingredient_name: '', quantity: 0, unit: 'g', memo: '' }] as any[],
  });

  useEffect(() => {
    if (data?.recipe) {
      const r = data.recipe;
      setForm({
        title: r.title, english_name: r.english_name || '', category: r.category,
        description: r.description || '', serving_size: r.serving_size || '',
        batch_size: r.batch_size || '', cook_time: r.cook_time || '',
        storage_method: r.storage_method || '', expiry_rule: r.expiry_rule || '',
        plating_guide: r.plating_guide || '', warnings: r.warnings || '',
        photo_url: r.photo_url || '', video_url: r.video_url || '',
        visibility_scope: r.visibility_scope, status: r.status,
        allergy_info: r.allergy_info || [],
        cook_steps: (r.cook_steps as string[]) || [''],
        cost_info: { material_cost: '', sale_price: '', supplier: '', ...(r.cost_info as any) },
        ingredients: data.ingredients.length ? data.ingredients : [{ ingredient_name: '', quantity: 0, unit: 'g', memo: '' }],
      });
    }
  }, [data]);

  const save = async (publish = false) => {
    if (!form.title.trim()) { toast.error('필수 항목을 입력해주세요.'); return; }
    const payload: any = {
      title: form.title, english_name: form.english_name || null, category: form.category,
      description: form.description, serving_size: form.serving_size, batch_size: form.batch_size,
      cook_time: form.cook_time, storage_method: form.storage_method, expiry_rule: form.expiry_rule,
      plating_guide: form.plating_guide, warnings: form.warnings,
      photo_url: form.photo_url || null, video_url: form.video_url || null,
      visibility_scope: form.visibility_scope, status: publish ? 'published' : form.status,
      allergy_info: form.allergy_info,
      cook_steps: form.cook_steps.filter(Boolean),
      cost_info: form.cost_info,
      ingredients: form.ingredients.filter(i => i.ingredient_name?.trim()),
    };
    try {
      if (isNew) {
        const created = await create.mutateAsync(payload);
        toast.success('레시피가 저장되었습니다.');
        navigate(`/knowledge/recipes/${created.id}`);
      } else {
        await update.mutateAsync({ id: id!, ...payload, bumpVersion: publish && data?.recipe?.status === 'published' });
        toast.success('레시피가 저장되었습니다.');
        setEditing(false);
      }
    } catch (e: any) { toast.error(e.message); }
  };

  const showCost = perms.canViewCost;

  return (
    <div className="container max-w-5xl py-6 space-y-4">
      <Button variant="ghost" size="sm" asChild><Link to="/knowledge"><ArrowLeft className="w-4 h-4 mr-1" />목록으로</Link></Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle>{isNew ? '새 레시피 작성' : (editing ? '레시피 수정' : data?.recipe?.title)}</CardTitle>
            <div className="flex gap-2">
              {!isNew && !editing && perms.canManage && <Button variant="outline" size="sm" onClick={() => setEditing(true)}>수정</Button>}
              {!isNew && !editing && perms.canManage && (
                <Button variant="outline" size="sm" onClick={async () => {
                  if (!confirm('이 레시피를 삭제하시겠습니까?')) return;
                  await remove.mutateAsync(id!); toast.success('삭제되었습니다.'); navigate('/knowledge');
                }}><Trash2 className="w-4 h-4" /></Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="grid md:grid-cols-2 gap-3">
                <Field label="메뉴명 *"><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
                <Field label="영문명"><Input value={form.english_name} onChange={e => setForm({ ...form, english_name: e.target.value })} /></Field>
                <Field label="카테고리">
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{RECIPE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="공개 범위">
                  <Select value={form.visibility_scope} onValueChange={v => setForm({ ...form, visibility_scope: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{VISIBILITY.map(x => <SelectItem key={x.v} value={x.v}>{x.l}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="기준 제공량"><Input value={form.serving_size} onChange={e => setForm({ ...form, serving_size: e.target.value })} placeholder="예: 1인분" /></Field>
                <Field label="제조 수량"><Input value={form.batch_size} onChange={e => setForm({ ...form, batch_size: e.target.value })} placeholder="예: 5kg 1통" /></Field>
                <Field label="조리 시간"><Input value={form.cook_time} onChange={e => setForm({ ...form, cook_time: e.target.value })} placeholder="예: 30분" /></Field>
                <Field label="보관 방법"><Input value={form.storage_method} onChange={e => setForm({ ...form, storage_method: e.target.value })} /></Field>
                <Field label="소비기한 / 사용기한"><Input value={form.expiry_rule} onChange={e => setForm({ ...form, expiry_rule: e.target.value })} placeholder="예: 냉장 3일" /></Field>
                <Field label="사진 URL"><Input value={form.photo_url} onChange={e => setForm({ ...form, photo_url: e.target.value })} /></Field>
              </div>
              <Field label="설명"><Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>

              <Field label="재료 목록">
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground px-2">
                    <span className="col-span-5">식재료명</span><span className="col-span-2">수량</span><span className="col-span-2">단위</span><span className="col-span-2">비고</span>
                  </div>
                  {form.ingredients.map((ing, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <Input className="col-span-5" value={ing.ingredient_name} onChange={e => {
                        const n = [...form.ingredients]; n[i].ingredient_name = e.target.value; setForm({ ...form, ingredients: n });
                      }} placeholder="예: 양갈비" />
                      <Input className="col-span-2" type="number" value={ing.quantity ?? ''} onChange={e => {
                        const n = [...form.ingredients]; n[i].quantity = parseFloat(e.target.value) || 0; setForm({ ...form, ingredients: n });
                      }} />
                      <Input className="col-span-2" value={ing.unit || ''} onChange={e => {
                        const n = [...form.ingredients]; n[i].unit = e.target.value; setForm({ ...form, ingredients: n });
                      }} placeholder="g/ml/개" />
                      <Input className="col-span-2" value={ing.memo || ''} onChange={e => {
                        const n = [...form.ingredients]; n[i].memo = e.target.value; setForm({ ...form, ingredients: n });
                      }} />
                      <Button variant="ghost" size="icon" className="col-span-1" onClick={() => setForm({ ...form, ingredients: form.ingredients.filter((_, x) => x !== i) })}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setForm({ ...form, ingredients: [...form.ingredients, { ingredient_name: '', quantity: 0, unit: 'g', memo: '' }] })}><Plus className="w-4 h-4 mr-1" />재료 추가</Button>
                </div>
              </Field>

              <Field label="조리 순서">
                <div className="space-y-2">
                  {form.cook_steps.map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="w-8 h-10 flex items-center justify-center text-sm text-muted-foreground">{i + 1}.</span>
                      <Textarea rows={2} value={s} onChange={e => { const n = [...form.cook_steps]; n[i] = e.target.value; setForm({ ...form, cook_steps: n }); }} />
                      <Button variant="ghost" size="icon" onClick={() => setForm({ ...form, cook_steps: form.cook_steps.filter((_, x) => x !== i) })}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setForm({ ...form, cook_steps: [...form.cook_steps, ''] })}><Plus className="w-4 h-4 mr-1" />단계 추가</Button>
                </div>
              </Field>

              <Field label="플레이팅 방법"><Textarea rows={2} value={form.plating_guide} onChange={e => setForm({ ...form, plating_guide: e.target.value })} /></Field>
              <Field label="주의사항"><Textarea rows={2} value={form.warnings} onChange={e => setForm({ ...form, warnings: e.target.value })} /></Field>

              <Field label="알레르기 정보">
                <div className="flex flex-wrap gap-2">
                  {ALLERGENS.map(a => (
                    <label key={a} className="flex items-center gap-1.5 text-xs px-2 py-1 border border-border rounded cursor-pointer">
                      <Checkbox checked={form.allergy_info.includes(a)} onCheckedChange={c => setForm({ ...form,
                        allergy_info: c ? [...form.allergy_info, a] : form.allergy_info.filter(x => x !== a)
                      })} />{a}
                    </label>
                  ))}
                </div>
              </Field>

              {showCost && (
                <div className="border border-border rounded-lg p-3 space-y-3">
                  <p className="text-sm font-medium">원가 정보 (매니저 이상 전용)</p>
                  <div className="grid md:grid-cols-3 gap-2">
                    <Input placeholder="재료 원가" value={form.cost_info.material_cost} onChange={e => setForm({ ...form, cost_info: { ...form.cost_info, material_cost: e.target.value } })} />
                    <Input placeholder="판매가" value={form.cost_info.sale_price} onChange={e => setForm({ ...form, cost_info: { ...form.cost_info, sale_price: e.target.value } })} />
                    <Input placeholder="공급처" value={form.cost_info.supplier} onChange={e => setForm({ ...form, cost_info: { ...form.cost_info, supplier: e.target.value } })} />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button onClick={() => save(false)}><Save className="w-4 h-4 mr-1" />임시저장</Button>
                <Button onClick={() => save(true)}>게시 (버전 저장)</Button>
                {!isNew && <Button variant="outline" onClick={() => setEditing(false)}>취소</Button>}
              </div>
            </>
          ) : data?.recipe ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{data.recipe.category}</Badge>
                <Badge>{data.recipe.status === 'published' ? '게시됨' : '임시저장'}</Badge>
                <Badge variant="outline">v{data.recipe.version}</Badge>
                {data.recipe.allergy_info?.map(a => <Badge key={a} variant="outline" className="border-orange-500 text-orange-500">{a}</Badge>)}
              </div>
              {data.recipe.description && <p className="text-sm text-muted-foreground">{data.recipe.description}</p>}
              <div className="grid md:grid-cols-3 gap-3 text-sm">
                <Info label="기준 제공량" value={data.recipe.serving_size} />
                <Info label="제조 수량" value={data.recipe.batch_size} />
                <Info label="조리 시간" value={data.recipe.cook_time} />
                <Info label="보관 방법" value={data.recipe.storage_method} />
                <Info label="소비기한" value={data.recipe.expiry_rule} />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">재료</h3>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50"><tr><th className="text-left p-2">식재료</th><th className="text-right p-2">수량</th><th className="text-left p-2">단위</th><th className="text-left p-2">비고</th></tr></thead>
                    <tbody>
                      {data.ingredients.map(i => (
                        <tr key={i.id} className="border-t border-border"><td className="p-2">{i.ingredient_name}</td><td className="p-2 text-right">{i.quantity}</td><td className="p-2">{i.unit}</td><td className="p-2 text-muted-foreground">{i.memo}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">조리 순서</h3>
                <ol className="list-decimal pl-5 space-y-1.5 text-sm">
                  {((data.recipe.cook_steps as string[]) || []).map((s, i) => <li key={i} className="whitespace-pre-wrap">{s}</li>)}
                </ol>
              </div>
              {data.recipe.plating_guide && <Block title="플레이팅" body={data.recipe.plating_guide} />}
              {data.recipe.warnings && <Block title="주의사항" body={data.recipe.warnings} />}
              {showCost && data.recipe.cost_info && Object.values(data.recipe.cost_info as any).some(Boolean) && (
                <div className="border border-amber-500/40 bg-amber-500/5 rounded-lg p-3 space-y-1">
                  <p className="text-sm font-medium">원가 정보 (매니저 전용)</p>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {(data.recipe.cost_info as any).material_cost && <p>재료 원가: {(data.recipe.cost_info as any).material_cost}</p>}
                    {(data.recipe.cost_info as any).sale_price && <p>판매가: {(data.recipe.cost_info as any).sale_price}</p>}
                    {(data.recipe.cost_info as any).supplier && <p>공급처: {(data.recipe.cost_info as any).supplier}</p>}
                  </div>
                </div>
              )}
              {data.versions.length > 0 && perms.canManage && (
                <div className="border border-border rounded-lg p-3">
                  <p className="text-sm font-medium mb-2">버전 기록</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {data.versions.map((v: any) => <li key={v.id}>v{v.version_number} — {new Date(v.created_at).toLocaleString('ko-KR')}</li>)}
                  </ul>
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
function Info({ label, value }: { label: string; value: string | null }) {
  return <div><p className="text-xs text-muted-foreground">{label}</p><p>{value || '-'}</p></div>;
}
function Block({ title, body }: { title: string; body: string }) {
  return <div className="space-y-1"><h4 className="font-medium text-sm">{title}</h4><p className="text-sm text-muted-foreground whitespace-pre-wrap">{body}</p></div>;
}
