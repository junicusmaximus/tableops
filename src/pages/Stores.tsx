import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/common/StatusBadge';
import { Plus, Store as StoreIcon, MapPin } from 'lucide-react';

const demoStores = [
  { id: 1, name: '강남본점', brand: 'TableOps Kitchen', address: '서울 강남구 테헤란로 123', manager: '김민수', employees: 12, status: '운영중' },
  { id: 2, name: '홍대점', brand: 'TableOps Kitchen', address: '서울 마포구 홍익로 45', manager: '최영희', employees: 10, status: '운영중' },
  { id: 3, name: '이태원점', brand: 'TableOps Kitchen', address: '서울 용산구 이태원로 67', manager: '정수민', employees: 8, status: '운영중' },
];

const Stores = () => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">매장 관리</h1>
          <p className="text-muted-foreground text-sm mt-1">전체 매장 현황</p>
        </div>
        <Button><Plus className="w-4 h-4 mr-2" />매장 추가</Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {demoStores.map((store) => (
          <Card key={store.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <StoreIcon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{store.name}</h3>
                    <StatusBadge status="success" label={store.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{store.brand}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {store.address}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>매니저: {store.manager}</span>
                    <span>직원: {store.employees}명</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Stores;
