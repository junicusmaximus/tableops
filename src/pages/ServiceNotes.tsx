import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/common/StatusBadge';
import { Plus, AlertTriangle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const categories = ['전체', '알레르기', '영유아', '재방문', 'VIP', '특별주문', '컴플레인', '칭찬'];

const demoNotes = [
  { id: 1, category: '알레르기', customer: '김OO', content: '갑각류 알레르기. 새우, 게 절대 사용 불가.', importance: 'high', date: '2026-03-01', visibleTo: '전체 공유' },
  { id: 2, category: 'VIP', customer: '이OO', content: 'VIP 단골 고객. 항상 2번 테이블 선호. 스파클링 워터 제공.', importance: 'high', date: '2026-03-01', visibleTo: '매니저 이상' },
  { id: 3, category: '영유아', customer: '박OO', content: '만 2세 아이 동반. 하이체어 필요. 아기 식기 요청.', importance: 'medium', date: '2026-03-02', visibleTo: '전체 공유' },
  { id: 4, category: '특별주문', customer: '최OO', content: '글루텐프리 메뉴 요청. 파스타 대신 쌀면 대체.', importance: 'medium', date: '2026-03-02', visibleTo: '주방+홀' },
  { id: 5, category: '재방문', customer: '정OO', content: '3회 이상 방문. 지난번 서비스 불만 후 재방문. 각별한 응대 필요.', importance: 'high', date: '2026-03-02', visibleTo: '매니저 이상' },
  { id: 6, category: '컴플레인', customer: '한OO', content: '지난주 음식 온도 불만 접수. 사과 서비스 디저트 제공 완료.', importance: 'low', date: '2026-02-28', visibleTo: '매니저 이상' },
];

const importanceColors = {
  high: 'destructive' as const,
  medium: 'warning' as const,
  low: 'default' as const,
};

const ServiceNotes = () => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">고객 서비스 노트</h1>
          <p className="text-muted-foreground text-sm mt-1">고객별 특이사항 및 서비스 메모</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          노트 작성
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {categories.map((cat) => (
          <Button key={cat} variant={cat === '전체' ? 'default' : 'outline'} size="sm" className="shrink-0">
            {cat}
          </Button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="고객명 또는 내용 검색..." className="pl-9" />
      </div>

      {/* Notes List */}
      <div className="space-y-3">
        {demoNotes.map((note) => (
          <Card key={note.id}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge status={importanceColors[note.importance as keyof typeof importanceColors]} label={note.category} />
                    <span className="text-sm font-semibold">{note.customer}</span>
                    <span className="text-xs text-muted-foreground">{note.visibleTo}</span>
                  </div>
                  <p className="text-sm">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">{note.date}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ServiceNotes;
