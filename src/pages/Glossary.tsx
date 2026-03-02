import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, BookOpen } from 'lucide-react';

const categories = ['전체', '홀', '주방', '서비스', '재고', '위생', '구매', 'CS'];

const demoTerms = [
  { id: 1, term: '투핸드 서비스', category: '서비스', definition: '두 손으로 음식이나 음료를 제공하는 서비스 방식. 한 손으로는 접시를, 다른 손으로는 받쳐주는 형태.', example: '메인 요리를 서빙할 때 반드시 투핸드 서비스로 제공합니다.' },
  { id: 2, term: 'FIFO', category: '재고', definition: 'First In First Out. 먼저 입고된 식재료를 먼저 사용하는 재고 관리 원칙.', example: '냉장고 정리 시 새로 입고된 재료는 뒤에, 기존 재료는 앞에 배치합니다.' },
  { id: 3, term: '미장플라스', category: '주방', definition: 'Mise en place. 조리 전 모든 재료와 도구를 미리 준비하고 정리해두는 것.', example: '오픈 전 미장플라스를 완료하여 서비스 준비를 마칩니다.' },
  { id: 4, term: '86', category: '주방', definition: '메뉴 품절을 의미하는 업계 용어. 재료 소진이나 기타 사유로 더 이상 판매할 수 없는 상태.', example: '"연어 스테이크 86!" - 연어 스테이크가 품절되었음을 알림.' },
  { id: 5, term: 'SOP', category: '서비스', definition: 'Standard Operating Procedure. 표준 운영 절차. 일관된 서비스 품질을 위한 표준화된 업무 절차.', example: '신입 직원은 첫 주에 모든 SOP를 숙지해야 합니다.' },
  { id: 6, term: '크로스 컨태미네이션', category: '위생', definition: '교차 오염. 다른 식품이나 오염원에 의해 식품이 오염되는 것.', example: '날고기 도마와 채소 도마를 반드시 구분하여 사용합니다.' },
];

const Glossary = () => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">용어 / 매뉴얼</h1>
        <p className="text-muted-foreground text-sm mt-1">레스토랑 운영 용어 사전</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {categories.map((cat) => (
          <Button key={cat} variant={cat === '전체' ? 'default' : 'outline'} size="sm" className="shrink-0">{cat}</Button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="용어 검색..." className="pl-9" />
      </div>

      <div className="space-y-3">
        {demoTerms.map((term) => (
          <Card key={term.id}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0 mt-0.5">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{term.term}</h3>
                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{term.category}</span>
                  </div>
                  <p className="text-sm text-foreground">{term.definition}</p>
                  <p className="text-xs text-muted-foreground mt-2 italic">💡 {term.example}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Glossary;
