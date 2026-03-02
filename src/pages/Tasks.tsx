import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/common/StatusBadge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, ClipboardCheck } from 'lucide-react';

const demoChecklists = [
  {
    id: 1, name: '오픈 체크리스트', type: '오픈', progress: 67,
    items: [
      { id: 1, text: '조명/에어컨 가동', done: true },
      { id: 2, text: '테이블/의자 정리 및 세팅', done: true },
      { id: 3, text: '바닥/화장실 청소 확인', done: true },
      { id: 4, text: 'POS 시스템 확인', done: true },
      { id: 5, text: '식재료 상태 점검', done: false },
      { id: 6, text: '예약 현황 확인', done: false },
    ]
  },
  {
    id: 2, name: '마감 체크리스트', type: '마감', progress: 0,
    items: [
      { id: 1, text: '정산 완료', done: false },
      { id: 2, text: '잔여 식재료 정리', done: false },
      { id: 3, text: '주방 청소', done: false },
      { id: 4, text: '가스/전기 차단', done: false },
      { id: 5, text: '쓰레기 처리', done: false },
      { id: 6, text: '시건장치 확인', done: false },
    ]
  },
];

const Tasks = () => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">체크리스트</h1>
          <p className="text-muted-foreground text-sm mt-1">오픈/마감 및 업무 체크리스트</p>
        </div>
        <Button><Plus className="w-4 h-4 mr-2" />체크리스트 추가</Button>
      </div>

      {demoChecklists.map((checklist) => (
        <Card key={checklist.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">{checklist.name}</CardTitle>
              </div>
              <StatusBadge
                status={checklist.progress === 100 ? 'success' : checklist.progress > 0 ? 'warning' : 'default'}
                label={`${checklist.progress}%`}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {checklist.items.map((item) => (
              <label key={item.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0 cursor-pointer">
                <Checkbox checked={item.done} />
                <span className={`text-sm ${item.done ? 'line-through text-muted-foreground' : ''}`}>{item.text}</span>
              </label>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Tasks;
