import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, THeader as _TH, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, ShieldAlert, Upload, Plug, Users, AlertCircle, CheckCircle2, Loader2, Trash2, Download } from 'lucide-react';
import { useEmployeeProfile, useStoreEmployees } from '@/hooks/useEmployeeProfile';
import { useIsManager } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import {
  PROVIDERS,
  PROVIDER_LABEL,
  REQUIRED_COLUMNS,
  COLUMN_LABEL,
  type AccessColumn,
  type AccessProvider,
  type ParsedAccessRow,
  normalizeAccessType,
  parseDateTime,
  reconcile,
  STATUS_BADGE,
  CONSENT_TEXT,
} from '@/lib/accessIntegration';
import {
  useAccessIntegrations,
  useUpsertIntegration,
  useDeleteIntegration,
  useImportAccessLogs,
  useImportBatches,
  useAccessLogs,
  useUpdateAccessLogMatch,
  useUpdateEmployeeAccessMapping,
  useUpdateAccessConsent,
} from '@/hooks/useAccessIntegration';
import { useAttendanceLogs } from '@/hooks/useAttendance';
import StatusBadge from '@/components/common/StatusBadge';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

const AccessIntegration = () => {
  const navigate = useNavigate();
  const isManager = useIsManager();
  const { data: profile } = useEmployeeProfile();
  const storeId = profile?.store_id;
  const { toast } = useToast();

  const { data: integrations } = useAccessIntegrations(storeId);
  const { data: batches } = useImportBatches(storeId);
  const today = format(new Date(), 'yyyy-MM-dd');
  const [filterDate, setFilterDate] = useState(today);
  const { data: accessLogs } = useAccessLogs(storeId, filterDate);
  const { data: attendanceLogs } = useAttendanceLogs(storeId, filterDate);
  const { data: employees } = useStoreEmployees(storeId);

  const [setupOpen, setSetupOpen] = useState(false);
  const [setupProvider, setSetupProvider] = useState<AccessProvider>('adt_caps');
  const [setupForm, setSetupForm] = useState({
    integration_mode: 'csv_import',
    api_base_url: '',
    api_key: '',
    secret_key: '',
    local_export_path: '',
    sync_frequency: 'manual',
  });

  const upsertIntegration = useUpsertIntegration();
  const deleteIntegration = useDeleteIntegration();
  const importLogs = useImportAccessLogs();
  const updateMatch = useUpdateAccessLogMatch();
  const updateMapping = useUpdateEmployeeAccessMapping();
  const updateConsent = useUpdateAccessConsent();

  // Import dialog state
  const [importOpen, setImportOpen] = useState(false);
  const [importProvider, setImportProvider] = useState<AccessProvider>('csv_upload');
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, unknown>[]>([]);
  const [columnMap, setColumnMap] = useState<Partial<Record<AccessColumn, string>>>({});
  const [fileName, setFileName] = useState('');

  if (!storeId) {
    return <div className="p-6">매장 정보를 불러오는 중...</div>;
  }

  if (!isManager) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> 뒤로
        </Button>
        <Card>
          <CardContent className="py-16 text-center">
            <ShieldAlert className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-base font-medium">관리자 직급 이상부터 사용 가능한 영역입니다.</p>
            <p className="text-sm text-muted-foreground mt-2">대표, 사장님, 매니저 권한이 필요합니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onSelectFile = async (file: File) => {
    setFileName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase();
    const finishParsing = (rows: Record<string, unknown>[]) => {
      if (rows.length === 0) {
        toast({ title: '빈 파일', description: '데이터가 없습니다.', variant: 'destructive' });
        return;
      }
      const headers = Object.keys(rows[0]);
      setParsedHeaders(headers);
      setParsedRows(rows);
      // Auto-map by name match
      const auto: Partial<Record<AccessColumn, string>> = {};
      for (const col of REQUIRED_COLUMNS) {
        const m = headers.find(
          (h) => h.toLowerCase().replace(/\s/g, '') === col.toLowerCase() ||
                 h === COLUMN_LABEL[col]
        );
        if (m) auto[col] = m;
      }
      setColumnMap(auto);
    };

    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => finishParsing(res.data as Record<string, unknown>[]),
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
      finishParsing(json);
    } else {
      toast({ title: '지원되지 않는 형식', description: 'CSV 또는 Excel 파일을 업로드해주세요.', variant: 'destructive' });
    }
  };

  const findEmployeeMatch = (row: ParsedAccessRow): string | null => {
    if (!employees) return null;
    const num = row.employee_number?.trim();
    if (num) {
      const m = employees.find((e: any) => e.employee_number === num);
      if (m) return m.id;
    }
    const card = row.access_card_number?.trim();
    if (card) {
      const m = employees.find((e: any) => e.access_card_number === card);
      if (m) return m.id;
    }
    const pid = row.provider_user_id?.trim();
    if (pid) {
      const m = employees.find((e: any) => e.access_provider_user_id === pid);
      if (m) return m.id;
    }
    const name = row.employee_name?.trim();
    if (name) {
      const m = employees.find((e) => e.full_name === name);
      if (m) return m.id;
    }
    return null;
  };

  const previewRows = useMemo<Array<ParsedAccessRow & { matchId: string | null }>>(() => {
    if (!parsedRows.length) return [];
    const dtCol = columnMap.access_datetime;
    if (!dtCol) return [];
    return parsedRows
      .map((r) => {
        const dt = parseDateTime(r[dtCol]);
        if (!dt) return null;
        const row: ParsedAccessRow = {
          access_datetime: dt,
          employee_name: columnMap.employee_name ? String(r[columnMap.employee_name] ?? '') : undefined,
          employee_number: columnMap.employee_number ? String(r[columnMap.employee_number] ?? '') : undefined,
          access_card_number: columnMap.access_card_number ? String(r[columnMap.access_card_number] ?? '') : undefined,
          provider_user_id: columnMap.provider_user_id ? String(r[columnMap.provider_user_id] ?? '') : undefined,
          access_type: columnMap.access_type ? normalizeAccessType(r[columnMap.access_type]) : 'unknown',
          device_name: columnMap.device_name ? String(r[columnMap.device_name] ?? '') : undefined,
          door_name: columnMap.door_name ? String(r[columnMap.door_name] ?? '') : undefined,
          raw: r,
        };
        return { ...row, matchId: findEmployeeMatch(row) };
      })
      .filter(Boolean) as Array<ParsedAccessRow & { matchId: string | null }>;
  }, [parsedRows, columnMap, employees]);

  const unmatchedCount = previewRows.filter((r) => !r.matchId).length;

  const doImport = async () => {
    if (!previewRows.length) return;
    try {
      await importLogs.mutateAsync({
        store_id: storeId,
        provider: importProvider,
        file_name: fileName,
        rows: previewRows.map((r) => ({
          employee_profile_id: r.matchId,
          raw_employee_name: r.employee_name,
          employee_number: r.employee_number,
          access_card_number: r.access_card_number,
          provider_user_id: r.provider_user_id,
          access_datetime: r.access_datetime,
          access_type: r.access_type,
          device_name: r.device_name,
          door_name: r.door_name,
          raw_payload: r.raw,
        })),
      });
      toast({
        title: '출입기록을 업로드했습니다.',
        description: unmatchedCount > 0
          ? `${unmatchedCount}명 매칭되지 않은 직원이 있습니다.`
          : '출입기록 가져오기가 완료되었습니다.',
      });
      setImportOpen(false);
      setParsedRows([]);
      setParsedHeaders([]);
      setColumnMap({});
      setFileName('');
    } catch (e: any) {
      toast({ title: '업로드 실패', description: e.message, variant: 'destructive' });
    }
  };

  const downloadTemplate = () => {
    const headers = REQUIRED_COLUMNS.join(',');
    const sample = '홍길동,EMP001,A12345,USR001,2026-05-06 09:00:00,in,정문리더기,정문';
    const csv = headers + '\n' + sample;
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'access_logs_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // --- Comparison rows ---
  const comparisonRows = useMemo(() => {
    if (!employees || !attendanceLogs || !accessLogs) return [];
    const accessByEmp = new Map<string, typeof accessLogs>();
    for (const log of accessLogs) {
      if (!log.employee_profile_id) continue;
      const arr = accessByEmp.get(log.employee_profile_id) || [];
      arr.push(log);
      accessByEmp.set(log.employee_profile_id, arr);
    }
    const attByEmp = new Map(attendanceLogs.map((a) => [a.employee_profile_id, a]));

    const empIds = new Set<string>([
      ...employees.map((e) => e.id),
    ]);
    const rows: any[] = [];
    for (const emp of employees) {
      const att: any = attByEmp.get(emp.id);
      const access = accessByEmp.get(emp.id) || [];
      const sortedAccess = [...access].sort((a, b) => a.access_datetime.localeCompare(b.access_datetime));
      const accessFirst = sortedAccess[0]?.access_datetime ?? null;
      const accessLast = sortedAccess[sortedAccess.length - 1]?.access_datetime ?? null;

      if (!att && !accessFirst) continue;

      const result = reconcile({
        scheduledStart: att?.scheduled_start,
        scheduledEnd: att?.scheduled_end,
        appCheckIn: att?.check_in_at,
        appCheckOut: att?.check_out_at,
        accessFirst,
        accessLast,
      });
      rows.push({ emp, att, accessFirst, accessLast, result });
    }
    return rows;
  }, [employees, attendanceLogs, accessLogs]);

  const fmt = (s?: string | null) => (s ? format(new Date(s), 'HH:mm') : '-');

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/settings')} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> 설정으로
          </Button>
          <h1 className="text-2xl font-bold">출입 시스템 연동</h1>
          <p className="text-sm text-muted-foreground mt-1">
            ADT캡스, 세콤/에스원, KT텔레캅 등 출입 시스템의 출입기록을 근태 자료로 활용합니다.
          </p>
        </div>
        <Button onClick={() => setImportOpen(true)}>
          <Upload className="w-4 h-4 mr-2" /> 출입기록 업로드
        </Button>
      </div>

      <Tabs defaultValue="providers">
        <TabsList>
          <TabsTrigger value="providers"><Plug className="w-4 h-4 mr-1" />연동 제공업체</TabsTrigger>
          <TabsTrigger value="logs">출입기록</TabsTrigger>
          <TabsTrigger value="mapping"><Users className="w-4 h-4 mr-1" />직원 매칭</TabsTrigger>
          <TabsTrigger value="comparison">출퇴근 비교</TabsTrigger>
          <TabsTrigger value="privacy">개인정보</TabsTrigger>
        </TabsList>

        {/* Providers */}
        <TabsContent value="providers" className="space-y-3 mt-4">
          {PROVIDERS.map((p) => {
            const existing = integrations?.find((i) => i.provider === p.value);
            return (
              <Card key={p.value}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{p.label}</CardTitle>
                      <CardDescription>{p.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {existing ? (
                        <Badge variant="default" className="bg-success text-success-foreground">연동됨</Badge>
                      ) : (
                        <Badge variant="outline">미연동</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      마지막 동기화: {existing?.last_sync_at ? format(new Date(existing.last_sync_at), 'yyyy-MM-dd HH:mm') : '없음'}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSetupProvider(p.value);
                          setSetupForm({
                            integration_mode: existing?.integration_mode ?? 'csv_import',
                            api_base_url: existing?.api_base_url ?? '',
                            api_key: existing?.api_key ?? '',
                            secret_key: existing?.secret_key ?? '',
                            local_export_path: existing?.local_export_path ?? '',
                            sync_frequency: existing?.sync_frequency ?? 'manual',
                          });
                          setSetupOpen(true);
                        }}
                      >
                        {existing ? '설정 수정' : '연동 설정'}
                      </Button>
                      {existing && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              upsertIntegration.mutate(
                                { id: existing.id, store_id: storeId, provider: existing.provider, integration_mode: existing.integration_mode, last_sync_at: new Date().toISOString() } as any,
                              );
                              toast({ title: '연결 테스트', description: 'CSV 모드는 항상 사용 가능합니다. API 모드는 추후 지원됩니다.' });
                            }}
                          >
                            연결 테스트
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteIntegration.mutate(existing.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Logs */}
        <TabsContent value="logs" className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <Label>날짜</Label>
            <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-44" />
            <span className="text-sm text-muted-foreground ml-auto">총 {accessLogs?.length ?? 0}건</span>
          </div>
          <Card>
            <CardContent className="pt-4">
              {(!accessLogs || accessLogs.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-8">출입기록이 없습니다.</p>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>일시</TableHead>
                        <TableHead>제공업체</TableHead>
                        <TableHead>이름</TableHead>
                        <TableHead>사번</TableHead>
                        <TableHead>구분</TableHead>
                        <TableHead>출입문</TableHead>
                        <TableHead>매칭</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accessLogs.slice(0, 100).map((log) => {
                        const emp = employees?.find((e) => e.id === log.employee_profile_id);
                        return (
                          <TableRow key={log.id}>
                            <TableCell className="text-xs">{format(new Date(log.access_datetime), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                            <TableCell className="text-xs">{PROVIDER_LABEL[log.provider as AccessProvider] ?? log.provider}</TableCell>
                            <TableCell className="text-xs">{log.raw_employee_name ?? '-'}</TableCell>
                            <TableCell className="text-xs">{log.employee_number ?? '-'}</TableCell>
                            <TableCell className="text-xs">
                              {log.access_type === 'in' ? '입실' : log.access_type === 'out' ? '퇴실' : '-'}
                            </TableCell>
                            <TableCell className="text-xs">{log.door_name ?? '-'}</TableCell>
                            <TableCell>
                              {emp ? (
                                <Badge variant="outline" className="text-xs">{emp.full_name}</Badge>
                              ) : (
                                <Select
                                  onValueChange={(v) => updateMatch.mutate({ id: log.id, employee_profile_id: v })}
                                >
                                  <SelectTrigger className="h-7 text-xs w-32">
                                    <SelectValue placeholder="매칭하기" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {employees?.map((e) => (
                                      <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">최근 가져오기</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(!batches || batches.length === 0) ? (
                <p className="text-xs text-muted-foreground">가져오기 기록이 없습니다.</p>
              ) : batches.map((b) => (
                <div key={b.id} className="flex items-center justify-between text-xs py-1 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium">{b.file_name ?? '-'}</p>
                    <p className="text-muted-foreground">
                      {format(new Date(b.imported_at), 'yyyy-MM-dd HH:mm')} · {PROVIDER_LABEL[b.provider as AccessProvider] ?? b.provider}
                    </p>
                  </div>
                  <div className="text-right">
                    <p>총 {b.row_count}건</p>
                    <p className="text-muted-foreground">매칭 {b.matched_count} · 미매칭 {b.unmatched_count}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mapping */}
        <TabsContent value="mapping" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">직원 매칭</CardTitle>
              <CardDescription>각 직원의 사번, 카드번호, 출입 시스템 사용자 ID를 등록합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>직원</TableHead>
                      <TableHead>사번</TableHead>
                      <TableHead>카드번호</TableHead>
                      <TableHead>제공업체</TableHead>
                      <TableHead>제공업체 사용자 ID</TableHead>
                      <TableHead>상태</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees?.map((e: any) => {
                      const matched = !!(e.employee_number || e.access_card_number || e.access_provider_user_id);
                      return (
                        <TableRow key={e.id}>
                          <TableCell className="text-xs font-medium">{e.full_name}</TableCell>
                          <TableCell>
                            <Input
                              defaultValue={e.employee_number ?? ''}
                              className="h-7 text-xs w-28"
                              onBlur={(ev) => updateMapping.mutate({ id: e.id, employee_number: ev.target.value || null })}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              defaultValue={e.access_card_number ?? ''}
                              className="h-7 text-xs w-32"
                              onBlur={(ev) => updateMapping.mutate({ id: e.id, access_card_number: ev.target.value || null })}
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              defaultValue={e.access_provider ?? 'none'}
                              onValueChange={(v) => updateMapping.mutate({ id: e.id, access_provider: v === 'none' ? null : v })}
                            >
                              <SelectTrigger className="h-7 text-xs w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">미지정</SelectItem>
                                {PROVIDERS.filter((p) => p.value !== 'csv_upload').map((p) => (
                                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              defaultValue={e.access_provider_user_id ?? ''}
                              className="h-7 text-xs w-32"
                              onBlur={(ev) => updateMapping.mutate({ id: e.id, access_provider_user_id: ev.target.value || null })}
                            />
                          </TableCell>
                          <TableCell>
                            <Badge variant={matched ? 'default' : 'outline'} className="text-xs">
                              {matched ? '매칭 완료' : '매칭 필요'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparison */}
        <TabsContent value="comparison" className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <Label>날짜</Label>
            <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-44" />
          </div>
          <Card>
            <CardContent className="pt-4">
              {comparisonRows.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">비교할 기록이 없습니다.</p>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>직원</TableHead>
                        <TableHead>스케줄</TableHead>
                        <TableHead>앱 출/퇴</TableHead>
                        <TableHead>출입 첫/마지막</TableHead>
                        <TableHead>상태</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comparisonRows.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs font-medium">{r.emp.full_name}</TableCell>
                          <TableCell className="text-xs">{fmt(r.att?.scheduled_start)} ~ {fmt(r.att?.scheduled_end)}</TableCell>
                          <TableCell className="text-xs">{fmt(r.att?.check_in_at)} / {fmt(r.att?.check_out_at)}</TableCell>
                          <TableCell className="text-xs">{fmt(r.accessFirst)} / {fmt(r.accessLast)}</TableCell>
                          <TableCell>
                            <StatusBadge status={STATUS_BADGE[r.result.status]} label={r.result.label} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy */}
        <TabsContent value="privacy" className="mt-4 space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">개인정보 동의</CardTitle>
              <CardDescription>출입기록은 개인정보입니다. 직원의 동의 상태를 관리합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-muted rounded text-xs">{CONSENT_TEXT}</div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>직원</TableHead>
                    <TableHead>동의 상태</TableHead>
                    <TableHead>동의 일시</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees?.map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs">{e.full_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={!!e.access_consent_accepted}
                            onCheckedChange={(v) => updateConsent.mutate({ id: e.id, accepted: v })}
                          />
                          <span className="text-xs">{e.access_consent_accepted ? '동의함' : '미동의'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {e.access_consent_accepted_at ? format(new Date(e.access_consent_accepted_at), 'yyyy-MM-dd') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Setup dialog */}
      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{PROVIDER_LABEL[setupProvider]} 연동 설정</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>연동 방식</Label>
              <Select value={setupForm.integration_mode} onValueChange={(v) => setSetupForm({ ...setupForm, integration_mode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv_import">CSV / 엑셀 업로드</SelectItem>
                  <SelectItem value="local_export">로컬 내보내기 (에이전트)</SelectItem>
                  <SelectItem value="api">API 연동</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {setupForm.integration_mode === 'api' && (
              <>
                <div><Label>API Base URL</Label><Input value={setupForm.api_base_url} onChange={(e) => setSetupForm({ ...setupForm, api_base_url: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>API Key</Label><Input value={setupForm.api_key} onChange={(e) => setSetupForm({ ...setupForm, api_key: e.target.value })} /></div>
                  <div><Label>Secret Key</Label><Input type="password" value={setupForm.secret_key} onChange={(e) => setSetupForm({ ...setupForm, secret_key: e.target.value })} /></div>
                </div>
                <div>
                  <Label>동기화 주기</Label>
                  <Select value={setupForm.sync_frequency} onValueChange={(v) => setSetupForm({ ...setupForm, sync_frequency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">수동</SelectItem>
                      <SelectItem value="hourly">매 시간</SelectItem>
                      <SelectItem value="daily">매일</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            {setupForm.integration_mode === 'local_export' && (
              <div><Label>로컬 내보내기 경로</Label><Input value={setupForm.local_export_path} onChange={(e) => setSetupForm({ ...setupForm, local_export_path: e.target.value })} placeholder="C:\AccessExport\" /></div>
            )}
            <div className="p-3 bg-muted rounded text-xs flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>현재 MVP 버전은 CSV/엑셀 업로드를 즉시 사용할 수 있으며, 로컬 에이전트 및 API 연동은 향후 업데이트에서 활성화됩니다.</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSetupOpen(false)}>취소</Button>
            <Button
              onClick={async () => {
                const existing = integrations?.find((i) => i.provider === setupProvider);
                await upsertIntegration.mutateAsync({
                  id: existing?.id,
                  store_id: storeId,
                  provider: setupProvider,
                  integration_mode: setupForm.integration_mode,
                  api_base_url: setupForm.api_base_url || null,
                  api_key: setupForm.api_key || null,
                  secret_key: setupForm.secret_key || null,
                  local_export_path: setupForm.local_export_path || null,
                  sync_frequency: setupForm.sync_frequency,
                  is_active: true,
                });
                toast({ title: '저장 완료', description: '연동 설정이 저장되었습니다.' });
                setSetupOpen(false);
              }}
            >
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>출입기록 업로드</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>제공업체</Label>
                <Select value={importProvider} onValueChange={(v) => setImportProvider(v as AccessProvider)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>파일</Label>
                <Input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => e.target.files?.[0] && onSelectFile(e.target.files[0])} />
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-1" /> 템플릿 다운로드
            </Button>

            {parsedHeaders.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">컬럼 매핑</p>
                <div className="grid grid-cols-2 gap-2">
                  {REQUIRED_COLUMNS.map((col) => (
                    <div key={col} className="flex items-center gap-2">
                      <Label className="w-32 text-xs">{COLUMN_LABEL[col]}</Label>
                      <Select value={columnMap[col] ?? '__none__'} onValueChange={(v) => setColumnMap({ ...columnMap, [col]: v === '__none__' ? undefined : v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="선택" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">사용 안함</SelectItem>
                          {parsedHeaders.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                <div className="text-sm pt-2">
                  미리보기 {previewRows.length}건 · 매칭 {previewRows.filter((r) => r.matchId).length}건 · 미매칭 {unmatchedCount}건
                </div>
                {unmatchedCount > 0 && (
                  <p className="text-xs text-warning flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> 매칭되지 않은 직원이 있습니다. 가져오기 후 출입기록 탭에서 매칭할 수 있습니다.
                  </p>
                )}
                <div className="max-h-48 overflow-auto border rounded">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">일시</TableHead>
                        <TableHead className="text-xs">이름</TableHead>
                        <TableHead className="text-xs">사번</TableHead>
                        <TableHead className="text-xs">구분</TableHead>
                        <TableHead className="text-xs">매칭</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewRows.slice(0, 30).map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">{format(new Date(r.access_datetime), 'MM-dd HH:mm')}</TableCell>
                          <TableCell className="text-xs">{r.employee_name ?? '-'}</TableCell>
                          <TableCell className="text-xs">{r.employee_number ?? '-'}</TableCell>
                          <TableCell className="text-xs">{r.access_type ?? '-'}</TableCell>
                          <TableCell className="text-xs">
                            {r.matchId ? (
                              <CheckCircle2 className="w-4 h-4 text-success" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-warning" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>취소</Button>
            <Button
              onClick={doImport}
              disabled={!previewRows.length || importLogs.isPending || !columnMap.access_datetime}
            >
              {importLogs.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {previewRows.length}건 가져오기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccessIntegration;
