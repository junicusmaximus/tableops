import { useState } from 'react';
import { useStaffList, useAddStaff, useUpdateStaff, StaffMember, INVITE_STATUS_LABELS, EMPLOYEE_STATUS_LABELS } from '@/hooks/useStaff';
import { ROLE_LABELS, AppRole, useIsManager } from '@/hooks/useUserRole';
import RoleBadge from '@/components/common/RoleBadge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Users, ShieldAlert, Clock, CheckCircle2, XCircle } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';

const EMPLOYMENT_TYPES: Record<string, string> = {
  full_time: '정규직',
  part_time: '파트타임',
  contract: '계약직',
};

const InviteStatusBadge = ({ status }: { status: string }) => {
  const label = INVITE_STATUS_LABELS[status] ?? status;
  if (status === 'pending') {
    return (
      <Badge variant="outline" className="text-[11px] font-medium px-2 py-0.5 border border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800">
        <Clock className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  }
  if (status === 'linked') {
    return (
      <Badge variant="outline" className="text-[11px] font-medium px-2 py-0.5 border border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[11px] font-medium px-2 py-0.5 border border-muted bg-muted text-muted-foreground">
      <XCircle className="w-3 h-3 mr-1" />
      {label}
    </Badge>
  );
};

const StaffManagement = () => {
  const { data: staff = [], isLoading } = useStaffList();
  const addStaff = useAddStaff();
  const isManager = useIsManager();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [inviteFilter, setInviteFilter] = useState<string>('all');
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
    const matchesInvite = inviteFilter === 'all' || s.invite_status === inviteFilter;
    return matchesSearch && matchesRole && matchesInvite;
  });

  const pendingCount = staff.filter((s) => s.invite_status === 'pending').length;
  const linkedCount = staff.filter((s) => s.invite_status === 'linked').length;

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
          <p className="text-muted-foreground text-sm mt-1">
            총 {staff.length}명 · 활성 {linkedCount}명 · 초대 대기 {pendingCount}명
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />직원 등록</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>새 직원 등록</DialogTitle></DialogHeader>
            <p className="text-xs text-muted-foreground -mt-2">
              직원이 아직 가입하지 않은 경우 초대 대기 상태로 먼저 등록할 수 있습니다. 가입 완료 후 사용자 계정이 자동으로 연결됩니다.
            </p>
            <div className="space-y-4 pt-2">
              <div><Label>이름 *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="홍길동" /></div>
              <div><Label>연락처 *</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="010-0000-0000" /><p className="text-xs text-muted-foreground mt-1">가입 시 자동 연결에 사용됩니다.</p></div>
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
              <Button onClick={handleAdd} disabled={!form.full_name || !form.phone || addStaff.isPending} className="w-full">
                {addStaff.isPending ? '등록 중...' : '초대 대기 상태로 등록'}
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
                <SelectItem value="all">전체 직급</SelectItem>
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={inviteFilter} onValueChange={setInviteFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="상태 필터" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="pending">초대 대기</SelectItem>
                <SelectItem value="linked">연결됨</SelectItem>
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
                    <TableHead>초대 상태</TableHead>
                    <TableHead className="hidden sm:table-cell">연락처</TableHead>
                    <TableHead className="hidden md:table-cell">고용형태</TableHead>
                    <TableHead className="hidden md:table-cell">입사일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.id} className={s.invite_status === 'pending' ? 'opacity-75' : ''}>
                      <TableCell className="font-medium">
                        <div>
                          {s.full_name}
                          {s.invite_status === 'pending' && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">아직 계정 미연결</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={s.role} />
                      </TableCell>
                      <TableCell>
                        <InviteStatusBadge status={s.invite_status} />
                      </TableCell>
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
