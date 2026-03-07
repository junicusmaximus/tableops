import { useState, useEffect } from 'react';
import {
  useChecklistTemplates, useTodayChecklistRuns,
  useCreateTemplate, useInitTodayRuns, useCompleteChecklistRun,
  ChecklistRun,
} from '@/hooks/useChecklists';
import { useIsManager } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, ClipboardCheck, Sun, Moon } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';

const Checklists = () => {
  const [tab, setTab] = useState<'execution' | 'templates'>('execution');
  const [typeFilter, setTypeFilter] = useState<'opening' | 'closing'>('opening');
  const { data: runs = [] } = useTodayChecklistRuns();
  const { data: templates = [] } = useChecklistTemplates();
  const isManager = useIsManager();
  const initRuns = useInitTodayRuns();
  const completeRun = useCompleteChecklistRun();
  const createTemplate = useCreateTemplate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', checklist_type: 'opening' as const, assigned_role: '' });

  useEffect(() => {
    if (templates.length > 0) {
      initRuns.mutate();
    }
  }, [templates.length]);

  const filteredRuns = runs.filter((r) => r.template?.checklist_type === typeFilter);
  const completedCount = filteredRuns.filter((r) => r.status === 'completed').length;
  const progressPercent = filteredRuns.length > 0 ? (completedCount / filteredRuns.length) * 100 : 0;

  const handleAddTemplate = async () => {
    await createTemplate.mutateAsync({
      checklist_type: form.checklist_type,
      title: form.title,
      description: form.description || undefined,
      assigned_role: form.assigned_role || undefined,
    });
    setDialogOpen(false);
    setForm({ title: '', description: '', checklist_type: 'opening', assigned_role: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">체크리스트</h1>
          <p className="text-muted-foreground text-sm mt-1">일일 오픈/마감 점검</p>
        </div>
        {isManager && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" />항목 추가</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>체크리스트 항목 추가</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>구분</Label>
                  <Select value={form.checklist_type} onValueChange={(v: any) => setForm({ ...form, checklist_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="opening">오픈</SelectItem>
                      <SelectItem value="closing">마감</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>항목명 *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="POS 작동 확인" /></div>
                <div><Label>설명</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="POS 장비 전원 및 네트워크 확인" /></div>
                <Button onClick={handleAddTemplate} disabled={!form.title || createTemplate.isPending} className="w-full">추가</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant={typeFilter === 'opening' ? 'default' : 'outline'} onClick={() => setTypeFilter('opening')}>
          <Sun className="w-4 h-4 mr-1" />오픈
        </Button>
        <Button variant={typeFilter === 'closing' ? 'default' : 'outline'} onClick={() => setTypeFilter('closing')}>
          <Moon className="w-4 h-4 mr-1" />마감
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {typeFilter === 'opening' ? '오픈' : '마감'} 체크리스트
            </CardTitle>
            <Badge variant="secondary">{completedCount}/{filteredRuns.length}</Badge>
          </div>
          <Progress value={progressPercent} className="h-2 mt-2" />
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredRuns.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="체크리스트가 없습니다" description={isManager ? '항목을 추가해 주세요.' : '매니저가 항목을 추가하면 표시됩니다.'} />
          ) : (
            filteredRuns.map((run) => (
              <div key={run.id} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <Checkbox
                  checked={run.status === 'completed'}
                  disabled={run.status === 'completed'}
                  onCheckedChange={() => completeRun.mutate({ runId: run.id })}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${run.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                    {run.template?.title}
                  </p>
                  {run.template?.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{run.template.description}</p>
                  )}
                  {run.completed_at && (
                    <p className="text-xs text-success mt-1">
                      ✓ {new Date(run.completed_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 완료
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {isManager && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">템플릿 관리</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {templates.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {t.checklist_type === 'opening' ? '오픈' : '마감'}
                      </Badge>
                      <span className="text-sm font-medium">{t.title}</span>
                    </div>
                    {t.description && <p className="text-xs text-muted-foreground mt-1">{t.description}</p>}
                  </div>
                </div>
              ))}
              {templates.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">등록된 템플릿이 없습니다</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Checklists;
