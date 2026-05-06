import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, FileText, Send, Inbox, Archive, Search, Trash2, Copy } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';
import { useToast } from '@/hooks/use-toast';
import { useIsManager } from '@/hooks/useUserRole';
import {
  useDocumentTemplates,
  useReceivedDocuments,
  useSentDocuments,
  useDeleteTemplate,
  useSaveTemplate,
} from '@/hooks/useDocuments';
import DocStatusBadge from '@/components/documents/DocStatusBadge';
import { SEED_TEMPLATES } from '@/lib/seedTemplates';
import type { DocumentSchema } from '@/lib/documentTypes';

const Documents = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isManager = useIsManager();
  const [search, setSearch] = useState('');

  const { data: templates = [], isLoading: tplLoading } = useDocumentTemplates();
  const { data: received = [] } = useReceivedDocuments();
  const { data: sent = [] } = useSentDocuments();
  const deleteTpl = useDeleteTemplate();
  const saveTpl = useSaveTemplate();

  const handleSeedTemplates = async () => {
    try {
      for (const t of SEED_TEMPLATES) {
        await saveTpl.mutateAsync({ title: t.title, category: t.category, description: t.description, schema: t.schema });
      }
      toast({ title: '기본 템플릿이 생성되었습니다' });
    } catch (e: any) {
      toast({ title: '오류', description: e.message, variant: 'destructive' });
    }
  };

  const handleDuplicate = async (tpl: any) => {
    await saveTpl.mutateAsync({
      title: `${tpl.title} (복사본)`,
      category: tpl.category,
      description: tpl.description ?? undefined,
      schema: tpl.template_schema as DocumentSchema,
    });
    toast({ title: '복제되었습니다' });
  };

  const filterFn = (s: string) => s.toLowerCase().includes(search.toLowerCase());
  const fReceived = received.filter((d) => filterFn(d.title));
  const fSent = sent.filter((d) => filterFn(d.title) || filterFn(d.recipient_name));
  const fTemplates = templates.filter((t) => filterFn(t.title) || filterFn(t.category));

  const defaultTab = isManager ? 'sent' : 'received';

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">전자문서</h1>
          <p className="text-muted-foreground text-sm mt-1">전자문서 작성·서명·보관</p>
        </div>
        {isManager && (
          <div className="flex gap-2">
            {templates.length === 0 && (
              <Button variant="outline" onClick={handleSeedTemplates} disabled={saveTpl.isPending}>
                기본 템플릿 추가
              </Button>
            )}
            <Button onClick={() => navigate('/documents/templates/new')}>
              <Plus className="w-4 h-4 mr-1" />새 템플릿
            </Button>
          </div>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="검색..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="w-full">
          <TabsTrigger value="received" className="flex-1"><Inbox className="w-4 h-4 mr-1" />받은 문서 ({received.length})</TabsTrigger>
          {isManager && <TabsTrigger value="sent" className="flex-1"><Send className="w-4 h-4 mr-1" />보낸 문서 ({sent.length})</TabsTrigger>}
          {isManager && <TabsTrigger value="templates" className="flex-1"><FileText className="w-4 h-4 mr-1" />템플릿 ({templates.length})</TabsTrigger>}
          <TabsTrigger value="archive" className="flex-1"><Archive className="w-4 h-4 mr-1" />보관함</TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-2 mt-4">
          {fReceived.length === 0 ? (
            <EmptyState icon={Inbox} title="서명 대기 중인 문서가 없습니다" description="요청된 문서가 도착하면 여기에 표시됩니다." />
          ) : fReceived.map((d) => (
            <Card key={d.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => navigate(d.status === 'completed' || d.status === 'cancelled' ? `/documents/view/${d.id}` : `/documents/sign/${d.id}`)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">{d.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {d.category && <span>{d.category} · </span>}
                    {d.due_date && <span>제출 기한: {d.due_date}</span>}
                  </p>
                </div>
                <DocStatusBadge status={d.status} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {isManager && (
          <TabsContent value="sent" className="space-y-2 mt-4">
            {fSent.length === 0 ? (
              <EmptyState icon={Send} title="발송한 문서가 없습니다" description="템플릿을 선택해 직원에게 문서를 보내세요." />
            ) : fSent.map((d) => (
              <Card key={d.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/documents/view/${d.id}`)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{d.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      수신자: {d.recipient_name}
                      {d.due_date && ` · 마감: ${d.due_date}`}
                      {d.completed_at && ` · 완료: ${new Date(d.completed_at).toLocaleDateString('ko-KR')}`}
                    </p>
                  </div>
                  <DocStatusBadge status={d.status} />
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        )}

        {isManager && (
          <TabsContent value="templates" className="space-y-2 mt-4">
            {tplLoading ? (
              <p className="text-sm text-muted-foreground">로딩 중...</p>
            ) : fTemplates.length === 0 ? (
              <EmptyState icon={FileText} title="사용할 수 있는 템플릿이 없습니다" description="새 템플릿을 만들거나 기본 템플릿을 추가하세요." />
            ) : fTemplates.map((t) => (
              <Card key={t.id}>
                <CardContent className="p-4 flex items-center justify-between gap-2">
                  <div className="flex-1 cursor-pointer" onClick={() => navigate(`/documents/templates/${t.id}`)}>
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.category} · {t.description ?? '-'}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/documents/send/${t.id}`}><Send className="w-3.5 h-3.5 mr-1" />발송</Link>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDuplicate(t)}><Copy className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm('삭제하시겠습니까?')) deleteTpl.mutate(t.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        )}

        <TabsContent value="archive" className="space-y-2 mt-4">
          {[...received, ...sent].filter((d) => d.status === 'completed').length === 0 ? (
            <EmptyState icon={Archive} title="보관된 문서가 없습니다" description="서명 완료된 문서가 여기에 보관됩니다." />
          ) : (
            [...new Map([...received, ...sent].filter((d) => d.status === 'completed').map((d) => [d.id, d])).values()].map((d) => (
              <Card key={d.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/documents/view/${d.id}`)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{d.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {d.recipient_name} · 완료: {d.completed_at ? new Date(d.completed_at).toLocaleDateString('ko-KR') : '-'}
                    </p>
                  </div>
                  <DocStatusBadge status={d.status} />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Documents;
