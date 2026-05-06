import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useArticles, useRecipes, useCourses, useMyAssignments, useStoreAssignments,
  useKnowledgePermissions, ARTICLE_CATEGORIES, RECIPE_CATEGORIES,
} from '@/hooks/useKnowledge';
import { BookOpen, ChefHat, GraduationCap, FileQuestion, BarChart3, Plus, Search, AlertCircle, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';
import { format } from 'date-fns';

const STATUS_LABEL: Record<string, string> = { draft: '임시저장', published: '게시됨', archived: '보관됨' };
const ASSIGN_LABEL: Record<string, string> = { not_started: '미시작', in_progress: '진행 중', completed: '완료', overdue: '기한 초과' };

export default function Knowledge() {
  const navigate = useNavigate();
  const perms = useKnowledgePermissions();
  const [tab, setTab] = useState('manuals');

  return (
    <div className="container max-w-7xl py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold">교육/매뉴얼</h1>
          <p className="text-sm text-muted-foreground">업무 매뉴얼 · 레시피북 · 직원 교육과 이수 현황을 한 곳에서 관리합니다.</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="manuals"><BookOpen className="w-4 h-4 mr-1.5" />업무 매뉴얼</TabsTrigger>
          <TabsTrigger value="recipes"><ChefHat className="w-4 h-4 mr-1.5" />레시피북</TabsTrigger>
          <TabsTrigger value="courses"><GraduationCap className="w-4 h-4 mr-1.5" />교육 자료</TabsTrigger>
          <TabsTrigger value="quizzes"><FileQuestion className="w-4 h-4 mr-1.5" />테스트/퀴즈</TabsTrigger>
          <TabsTrigger value="progress"><BarChart3 className="w-4 h-4 mr-1.5" />이수 현황</TabsTrigger>
        </TabsList>

        <TabsContent value="manuals" className="mt-4"><ManualsTab canManage={perms.canManage} /></TabsContent>
        <TabsContent value="recipes" className="mt-4"><RecipesTab canManage={perms.canManage} /></TabsContent>
        <TabsContent value="courses" className="mt-4"><CoursesTab canManage={perms.canManage} /></TabsContent>
        <TabsContent value="quizzes" className="mt-4"><QuizzesTab canManage={perms.canManage} /></TabsContent>
        <TabsContent value="progress" className="mt-4"><ProgressTab canManage={perms.canManage} /></TabsContent>
      </Tabs>
    </div>
  );
}

function ManualsTab({ canManage }: { canManage: boolean }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const { data: articles = [], isLoading } = useArticles(search, category);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="매뉴얼 검색..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 카테고리</SelectItem>
            {ARTICLE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        {canManage && (
          <Button asChild><Link to="/knowledge/articles/new"><Plus className="w-4 h-4 mr-1" />새 매뉴얼 작성</Link></Button>
        )}
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">로딩 중...</p>
        : articles.length === 0 ? <EmptyState icon={BookOpen} title="매뉴얼이 없습니다" description={canManage ? '새 매뉴얼을 작성하세요.' : '아직 등록된 매뉴얼이 없습니다.'} />
        : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <Link key={a.id} to={`/knowledge/articles/${a.id}`}>
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base line-clamp-2">{a.title}</CardTitle>
                      <Badge variant={a.status === 'published' ? 'default' : 'secondary'} className="shrink-0">{STATUS_LABEL[a.status]}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline">{a.category}</Badge>
                      {a.importance === 'critical' && <Badge variant="destructive">중요</Badge>}
                      {a.require_acknowledgement && <Badge variant="outline" className="border-amber-500 text-amber-500">확인서명</Badge>}
                      <Badge variant="outline">v{a.version}</Badge>
                    </div>
                    {a.summary && <p className="text-sm text-muted-foreground line-clamp-2">{a.summary}</p>}
                    <p className="text-xs text-muted-foreground">{format(new Date(a.updated_at), 'yyyy-MM-dd')}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
    </div>
  );
}

function RecipesTab({ canManage }: { canManage: boolean }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const { data: recipes = [], isLoading } = useRecipes(search, category);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="레시피 / 메뉴명 검색..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 카테고리</SelectItem>
            {RECIPE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        {canManage && (
          <Button asChild><Link to="/knowledge/recipes/new"><Plus className="w-4 h-4 mr-1" />새 레시피 작성</Link></Button>
        )}
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">로딩 중...</p>
        : recipes.length === 0 ? <EmptyState icon={ChefHat} title="레시피가 없습니다" description={canManage ? '새 레시피를 작성하세요.' : '아직 등록된 레시피가 없습니다.'} />
        : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {recipes.map((r) => (
              <Link key={r.id} to={`/knowledge/recipes/${r.id}`}>
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{r.title}</CardTitle>
                        {r.english_name && <p className="text-xs text-muted-foreground mt-0.5">{r.english_name}</p>}
                      </div>
                      <Badge variant={r.status === 'published' ? 'default' : 'secondary'}>{STATUS_LABEL[r.status]}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline">{r.category}</Badge>
                      <Badge variant="outline">v{r.version}</Badge>
                      {r.allergy_info?.slice(0, 3).map((al) => <Badge key={al} variant="outline" className="border-orange-500 text-orange-500">{al}</Badge>)}
                    </div>
                    {r.description && <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
    </div>
  );
}

function CoursesTab({ canManage }: { canManage: boolean }) {
  const { data: courses = [], isLoading } = useCourses();
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {canManage && <Button asChild><Link to="/knowledge/courses/new"><Plus className="w-4 h-4 mr-1" />교육 만들기</Link></Button>}
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">로딩 중...</p>
        : courses.length === 0 ? <EmptyState icon={GraduationCap} title="교육 자료가 없습니다" description={canManage ? '교육 코스를 만들고 직원에게 배정하세요.' : '배정된 교육이 없습니다.'} />
        : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <Link key={c.id} to={`/knowledge/courses/${c.id}`}>
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base line-clamp-2">{c.title}</CardTitle>
                      {c.required && <Badge variant="destructive" className="shrink-0">필수</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Badge variant="outline">{c.training_type}</Badge>
                    {c.description && <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>}
                    <p className="text-xs text-muted-foreground">예상 {c.estimated_minutes}분 · 기한 {c.due_days}일 · 합격 {c.pass_threshold}점</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
    </div>
  );
}

function QuizzesTab({ canManage }: { canManage: boolean }) {
  const { data: courses = [] } = useCourses();
  const navigate = useNavigate();
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">교육 코스에 포함된 퀴즈를 응시할 수 있습니다.</p>
      {courses.length === 0 ? <EmptyState icon={FileQuestion} title="퀴즈가 없습니다" description="교육 자료 탭에서 코스를 먼저 등록하세요." />
        : (
          <div className="grid gap-3 md:grid-cols-2">
            {courses.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">합격 기준 {c.pass_threshold}점</p>
                  </div>
                  <Button size="sm" onClick={() => navigate(`/knowledge/quizzes/${c.id}/take`)}>
                    퀴즈 응시 <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </div>
  );
}

function ProgressTab({ canManage }: { canManage: boolean }) {
  const { data: mine = [] } = useMyAssignments();
  const { data: store = [] } = useStoreAssignments();

  const list: any[] = canManage ? store : mine;
  const stats = {
    total: list.length,
    completed: list.filter((a: any) => a.status === 'completed').length,
    inProgress: list.filter((a: any) => a.status === 'in_progress').length,
    overdue: list.filter((a: any) => {
      if (a.status === 'completed') return false;
      if (!a.due_date) return false;
      return new Date(a.due_date) < new Date();
    }).length,
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard icon={GraduationCap} label="전체 배정" value={stats.total} />
        <StatCard icon={CheckCircle2} label="완료" value={stats.completed} />
        <StatCard icon={Clock} label="진행 중" value={stats.inProgress} />
        <StatCard icon={AlertCircle} label="기한 초과" value={stats.overdue} variant="destructive" />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">{canManage ? '직원별 이수 현황' : '내 학습 자료'}</CardTitle></CardHeader>
        <CardContent>
          {list.length === 0 ? <p className="text-sm text-muted-foreground">표시할 항목이 없습니다.</p>
            : (
              <div className="space-y-2">
                {list.map((a: any) => {
                  const overdue = a.status !== 'completed' && a.due_date && new Date(a.due_date) < new Date();
                  return (
                    <div key={a.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{a.training_courses?.title || '교육'}</p>
                        <p className="text-xs text-muted-foreground">
                          {canManage && a.employee_profiles?.full_name && `${a.employee_profiles.full_name} · `}
                          기한: {a.due_date || '-'}
                          {a.quiz_score !== null && ` · 점수 ${a.quiz_score}`}
                        </p>
                      </div>
                      <Badge variant={a.status === 'completed' ? 'default' : overdue ? 'destructive' : 'secondary'}>
                        {overdue ? '기한 초과' : ASSIGN_LABEL[a.status]}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, variant }: { icon: any; label: string; value: number; variant?: 'destructive' }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${variant === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
