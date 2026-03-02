import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/common/StatusBadge';
import { Plus, Upload, FileText, Download, Eye } from 'lucide-react';

const demoDocuments = [
  { id: 1, name: '김민수', docType: '근로계약서', status: '서명완료', startDate: '2025-01-01', endDate: '2026-12-31', daysToExpiry: 304 },
  { id: 2, name: '이지은', docType: '근로계약서', status: '서명완료', startDate: '2025-03-01', endDate: '2026-02-28', daysToExpiry: -2 },
  { id: 3, name: '박서준', docType: '보건증', status: '제출완료', startDate: '2025-06-15', endDate: '2026-06-14', daysToExpiry: 104 },
  { id: 4, name: '최유나', docType: '보건증', status: '미제출', startDate: null, endDate: null, daysToExpiry: null },
  { id: 5, name: '정하늘', docType: '교육이수증', status: '제출완료', startDate: '2025-09-01', endDate: '2026-08-31', daysToExpiry: 182 },
];

const Documents = () => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">서류 관리</h1>
          <p className="text-muted-foreground text-sm mt-1">근로계약서 및 직원 서류</p>
        </div>
        <Button><Upload className="w-4 h-4 mr-2" />서류 업로드</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">직원 서류 현황</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {demoDocuments.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted"><FileText className="w-4 h-4 text-muted-foreground" /></div>
                <div>
                  <p className="text-sm font-medium">{doc.name} · {doc.docType}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.startDate ? `${doc.startDate} ~ ${doc.endDate}` : '미등록'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {doc.daysToExpiry !== null && doc.daysToExpiry <= 30 && (
                  <StatusBadge status={doc.daysToExpiry <= 0 ? 'destructive' : 'warning'} label={doc.daysToExpiry <= 0 ? '만료' : `D-${doc.daysToExpiry}`} />
                )}
                <StatusBadge
                  status={doc.status === '서명완료' || doc.status === '제출완료' ? 'success' : 'destructive'}
                  label={doc.status}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Documents;
