import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { Plus, Upload, FileText, Download, Eye, Search, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocRecord {
  id: number;
  name: string;
  docType: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  daysToExpiry: number | null;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
}

const initialDocs: DocRecord[] = [
  { id: 1, name: '김민수', docType: '근로계약서', status: '서명완료', startDate: '2025-01-01', endDate: '2026-12-31', daysToExpiry: 304, fileName: '근로계약서_김민수.pdf', uploadedAt: '2025-01-02', uploadedBy: '관리자' },
  { id: 2, name: '이지은', docType: '근로계약서', status: '서명완료', startDate: '2025-03-01', endDate: '2026-02-28', daysToExpiry: -2, fileName: '근로계약서_이지은.pdf', uploadedAt: '2025-03-01', uploadedBy: '관리자' },
  { id: 3, name: '박서준', docType: '보건증', status: '제출완료', startDate: '2025-06-15', endDate: '2026-06-14', daysToExpiry: 104, fileName: '보건증_박서준.jpg', uploadedAt: '2025-06-15', uploadedBy: '박서준' },
  { id: 4, name: '최유나', docType: '보건증', status: '미제출', startDate: null, endDate: null, daysToExpiry: null, fileName: '', uploadedAt: '', uploadedBy: '' },
  { id: 5, name: '정하늘', docType: '교육이수증', status: '제출완료', startDate: '2025-09-01', endDate: '2026-08-31', daysToExpiry: 182, fileName: '교육이수증_정하늘.pdf', uploadedAt: '2025-09-02', uploadedBy: '정하늘' },
];

const Documents = () => {
  const { toast } = useToast();
  const [docs, setDocs] = useState<DocRecord[]>(initialDocs);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocRecord | null>(null);
  const [updateDocId, setUpdateDocId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('전체');
  const [uploadForm, setUploadForm] = useState({ name: '', docType: '근로계약서', startDate: '', endDate: '' });

  const filteredDocs = docs.filter(d => {
    const matchesSearch = d.name.includes(searchQuery) || d.docType.includes(searchQuery);
    const matchesType = typeFilter === '전체' || d.docType === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleUpload = () => {
    if (!uploadForm.name) {
      toast({ title: '입력 오류', description: '직원명을 입력해주세요.', variant: 'destructive' });
      return;
    }
    const newDoc: DocRecord = {
      id: Date.now(),
      name: uploadForm.name,
      docType: uploadForm.docType,
      status: '제출완료',
      startDate: uploadForm.startDate || null,
      endDate: uploadForm.endDate || null,
      daysToExpiry: uploadForm.endDate ? Math.ceil((new Date(uploadForm.endDate).getTime() - Date.now()) / 86400000) : null,
      fileName: `${uploadForm.docType}_${uploadForm.name}.pdf`,
      uploadedAt: new Date().toISOString().slice(0, 10),
      uploadedBy: '관리자',
    };
    setDocs(prev => [newDoc, ...prev]);
    setUploadOpen(false);
    setUploadForm({ name: '', docType: '근로계약서', startDate: '', endDate: '' });
    toast({ title: '업로드 완료', description: '서류가 성공적으로 업로드되었습니다.' });
  };

  const handleUpdate = (id: number) => {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, status: '제출완료', uploadedAt: new Date().toISOString().slice(0, 10), uploadedBy: '관리자' } : d));
    setUpdateDocId(null);
    toast({ title: '업데이트 완료', description: '서류가 성공적으로 업데이트되었습니다.' });
  };

  const handleDownload = (doc: DocRecord) => {
    toast({ title: '다운로드', description: `${doc.fileName} 다운로드를 시작합니다.` });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">서류 관리</h1>
          <p className="text-muted-foreground text-sm mt-1">근로계약서 및 직원 서류</p>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button><Upload className="w-4 h-4 mr-2" />서류 업로드</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>서류 업로드</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>직원명 *</Label><Input value={uploadForm.name} onChange={e => setUploadForm({ ...uploadForm, name: e.target.value })} placeholder="직원 이름" /></div>
              <div>
                <Label>서류 유형</Label>
                <Select value={uploadForm.docType} onValueChange={v => setUploadForm({ ...uploadForm, docType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="근로계약서">근로계약서</SelectItem>
                    <SelectItem value="보건증">보건증</SelectItem>
                    <SelectItem value="교육이수증">교육이수증</SelectItem>
                    <SelectItem value="신분증 사본">신분증 사본</SelectItem>
                    <SelectItem value="기타">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>유효기간 시작</Label><Input type="date" value={uploadForm.startDate} onChange={e => setUploadForm({ ...uploadForm, startDate: e.target.value })} /></div>
                <div><Label>유효기간 종료</Label><Input type="date" value={uploadForm.endDate} onChange={e => setUploadForm({ ...uploadForm, endDate: e.target.value })} /></div>
              </div>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">파일을 드래그하거나 클릭하여 업로드</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG (최대 10MB)</p>
              </div>
              <Button onClick={handleUpload} className="w-full">업로드</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Update Dialog */}
      <Dialog open={updateDocId !== null} onOpenChange={() => setUpdateDocId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>서류 업데이트</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">기존 서류를 새 파일로 교체합니다.</p>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors">
              <RefreshCw className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">새 파일을 선택하세요</p>
            </div>
            <Button onClick={() => updateDocId && handleUpdate(updateDocId)} className="w-full">업데이트 완료</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Sheet */}
      <Sheet open={previewDoc !== null} onOpenChange={() => setPreviewDoc(null)}>
        <SheetContent>
          <SheetHeader><SheetTitle>서류 상세</SheetTitle></SheetHeader>
          {previewDoc && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">직원명</span><span className="text-sm font-medium">{previewDoc.name}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">서류 유형</span><span className="text-sm font-medium">{previewDoc.docType}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">상태</span><StatusBadge status={previewDoc.status === '서명완료' || previewDoc.status === '제출완료' ? 'success' : 'destructive'} label={previewDoc.status} /></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">파일명</span><span className="text-sm font-medium">{previewDoc.fileName || '-'}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">유효기간</span><span className="text-sm">{previewDoc.startDate ? `${previewDoc.startDate} ~ ${previewDoc.endDate}` : '미등록'}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">업로드일</span><span className="text-sm">{previewDoc.uploadedAt || '-'}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">업로더</span><span className="text-sm">{previewDoc.uploadedBy || '-'}</span></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => handleDownload(previewDoc)}><Download className="w-4 h-4 mr-2" />다운로드</Button>
                <Button className="flex-1" onClick={() => { setPreviewDoc(null); setUpdateDocId(previewDoc.id); }}><RefreshCw className="w-4 h-4 mr-2" />업데이트</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="직원명 또는 서류 유형 검색..." className="pl-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="전체">전체</SelectItem>
            <SelectItem value="근로계약서">근로계약서</SelectItem>
            <SelectItem value="보건증">보건증</SelectItem>
            <SelectItem value="교육이수증">교육이수증</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">직원 서류 현황</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {filteredDocs.length === 0 ? (
            <EmptyState icon={FileText} title="서류가 없습니다" description="서류를 업로드해 주세요." action={<Button size="sm" onClick={() => setUploadOpen(true)}><Plus className="w-4 h-4 mr-1" />서류 업로드</Button>} />
          ) : filteredDocs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between py-3 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 rounded-lg px-2 transition-colors" onClick={() => setPreviewDoc(doc)}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted"><FileText className="w-4 h-4 text-muted-foreground" /></div>
                <div>
                  <p className="text-sm font-medium">{doc.name} · {doc.docType}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.startDate ? `${doc.startDate} ~ ${doc.endDate}` : '미등록'}
                    {doc.uploadedBy && ` · ${doc.uploadedBy}`}
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
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setUpdateDocId(doc.id); }}>
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Documents;
