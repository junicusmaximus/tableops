import { useState } from 'react';
import { useStaffList, useAddStaff, useUpdateStaff, StaffMember } from '@/hooks/useStaff';
import { ROLE_LABELS, AppRole, useIsManager } from '@/hooks/useUserRole';
import RoleBadge from '@/components/common/RoleBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Users, ShieldAlert } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';

const EMPLOYMENT_TYPES: Record<string, string> = {
  full_time: '정규직',
  part_time: '파트타임',
  contract: '계약직',
};

const StaffManagement = () => {
  const { data: staff = [], isLoading } = useStaffList();
  const addStaff = useAddStaff();
  const isManager = useIsManager();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: '', phone: '', position: '', employment_type: 'full_time', hire_date: '', role: 'full_time',
  });

  if (!isManager) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <ShieldAlert className="w-16 h-16 text-muted-foreground/40 mb-4" />
        <p className="text-lg font-medium text-foreground">관리자 직급 이상부터 사용 가능한 영역입니다.</p>
        <p className="text-sm text-muted-foreground mt-2">대표, 사장님, 매니저 권한이 필요합니다.</p>
      </div>
    );
  }

  const filtered = staff.filter((s) => {
    const matchesSearch = s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone?.includes(search));
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleAdd = async () => {
    await addStaff.mutateAsync(form);
    setDialogOpen(false);
    setForm({ full_name: '', phone: '', position: '', employment_type: 'full_time', hire_date: '', role: 'full_time' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">직원 관리</h1>
          <p className="text-muted-foreground text-sm mt-1">총 {staff.length}명</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />직원 추가</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>새 직원 등록</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>이름 *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="홍길동" /></div>
              <div><Label>연락처</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="010-0000-0000" /></div>
              <div><Label>직책</Label><Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="홀 매니저" /></div>
              <div>
                <Label>직급</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>고용 형태</Label>
                <Select value={form.employment_type} onValueChange={(v) => setForm({ ...form, employment_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(EMPLOYMENT_TYPES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>입사일</Label><Input type="date" value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} /></div>
              <Button onClick={handleAdd} disabled={!form.full_name || addStaff.isPending} className="w-full">
                {addStaff.isPending ? '등록 중...' : '등록하기'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="이름 또는 연락처로 검색" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="직급 필터" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState icon={Users} title="직원이 없습니다" description="직원을 추가해 주세요." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>직급</TableHead>
                    <TableHead className="hidden sm:table-cell">직책</TableHead>
                    <TableHead className="hidden sm:table-cell">연락처</TableHead>
                    <TableHead className="hidden md:table-cell">고용형태</TableHead>
                    <TableHead className="hidden md:table-cell">입사일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.full_name}</TableCell>
                      <TableCell>
                        <RoleBadge role={s.role} />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{s.position ?? '-'}</TableCell>
                      <TableCell className="hidden sm:table-cell">{s.phone ?? '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">{EMPLOYMENT_TYPES[s.employment_type ?? ''] ?? '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">{s.hire_date ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffManagement;
