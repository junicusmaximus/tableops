export type AccessProvider = 'adt_caps' | 'secom_s1' | 'kt_telecop' | 'other' | 'csv_upload';

export const PROVIDERS: { value: AccessProvider; label: string; description: string }[] = [
  { value: 'adt_caps', label: 'ADT캡스', description: 'ADT캡스 출입 시스템 연동' },
  { value: 'secom_s1', label: '세콤 / 에스원', description: '세콤·에스원 출입 시스템 연동' },
  { value: 'kt_telecop', label: 'KT텔레캅', description: 'KT텔레캅 출입 시스템 연동' },
  { value: 'other', label: '기타 출입 시스템', description: '기타 출입/보안 시스템' },
  { value: 'csv_upload', label: 'CSV / 엑셀 업로드', description: '출입 기록 파일 직접 업로드' },
];

export const PROVIDER_LABEL: Record<AccessProvider, string> = Object.fromEntries(
  PROVIDERS.map((p) => [p.value, p.label])
) as Record<AccessProvider, string>;

export type IntegrationMode = 'csv_import' | 'local_export' | 'api';

export const REQUIRED_COLUMNS = [
  'employee_name',
  'employee_number',
  'access_card_number',
  'provider_user_id',
  'access_datetime',
  'access_type',
  'device_name',
  'door_name',
] as const;
export type AccessColumn = typeof REQUIRED_COLUMNS[number];

export const COLUMN_LABEL: Record<AccessColumn, string> = {
  employee_name: '직원명',
  employee_number: '사번',
  access_card_number: '카드번호',
  provider_user_id: '출입 시스템 사용자 ID',
  access_datetime: '출입 일시',
  access_type: '출입 구분(in/out)',
  device_name: '장비명',
  door_name: '출입문',
};

export interface ParsedAccessRow {
  employee_name?: string;
  employee_number?: string;
  access_card_number?: string;
  provider_user_id?: string;
  access_datetime: string; // ISO
  access_type?: 'in' | 'out' | 'unknown';
  device_name?: string;
  door_name?: string;
  raw: Record<string, unknown>;
}

export const normalizeAccessType = (v: unknown): 'in' | 'out' | 'unknown' => {
  const s = String(v ?? '').trim().toLowerCase();
  if (['in', '입실', '출근', '입장', 'entry', 'enter'].some((k) => s.includes(k))) return 'in';
  if (['out', '퇴실', '퇴근', '퇴장', 'exit', 'leave'].some((k) => s.includes(k))) return 'out';
  return 'unknown';
};

export const parseDateTime = (v: unknown): string | null => {
  if (!v) return null;
  const s = String(v).trim();
  // try direct
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString();
  // YYYYMMDD HHMMSS
  const m = s.match(/^(\d{4})[-./]?(\d{2})[-./]?(\d{2})[ T]?(\d{2}):?(\d{2}):?(\d{2})?$/);
  if (m) {
    const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] ?? '00'}`;
    const dd = new Date(iso);
    if (!isNaN(dd.getTime())) return dd.toISOString();
  }
  return null;
};

export interface ReconciliationResult {
  status: 'normal' | 'late' | 'early_leave' | 'app_missing' | 'access_missing' | 'needs_review';
  label: string;
}

export const reconcile = (params: {
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  appCheckIn?: string | null;
  appCheckOut?: string | null;
  accessFirst?: string | null;
  accessLast?: string | null;
  lateThresholdMin?: number;
}): ReconciliationResult => {
  const { scheduledStart, scheduledEnd, appCheckIn, appCheckOut, accessFirst, accessLast } = params;
  const lateMin = params.lateThresholdMin ?? 5;

  const hasApp = !!(appCheckIn || appCheckOut);
  const hasAccess = !!(accessFirst || accessLast);

  if (!hasApp && hasAccess) return { status: 'app_missing', label: '앱 체크 누락' };
  if (hasApp && !hasAccess && (scheduledStart || scheduledEnd))
    return { status: 'access_missing', label: '출입기록 없음' };

  if (scheduledStart) {
    const sched = new Date(scheduledStart).getTime();
    const earliest = [appCheckIn, accessFirst].filter(Boolean).map((t) => new Date(t!).getTime());
    if (earliest.length) {
      const first = Math.min(...earliest);
      if (first - sched > lateMin * 60_000) return { status: 'late', label: '지각' };
    }
  }
  if (scheduledEnd) {
    const sched = new Date(scheduledEnd).getTime();
    const latest = [appCheckOut, accessLast].filter(Boolean).map((t) => new Date(t!).getTime());
    if (latest.length) {
      const last = Math.max(...latest);
      if (sched - last > lateMin * 60_000) return { status: 'early_leave', label: '조기퇴근' };
    }
  }

  if (hasApp && hasAccess && appCheckIn && accessFirst) {
    const diffMin = Math.abs(new Date(appCheckIn).getTime() - new Date(accessFirst).getTime()) / 60_000;
    if (diffMin > 30) return { status: 'needs_review', label: '확인 필요' };
  }

  return { status: 'normal', label: '정상' };
};

export const STATUS_BADGE: Record<ReconciliationResult['status'], 'success' | 'warning' | 'destructive' | 'info' | 'default'> = {
  normal: 'success',
  late: 'warning',
  early_leave: 'warning',
  app_missing: 'destructive',
  access_missing: 'destructive',
  needs_review: 'info',
};

export const CONSENT_TEXT =
  '본인은 출입 시스템의 출입기록이 근태 확인 및 매장 운영 관리를 위해 TableOps에 연동·저장될 수 있음에 동의합니다.';
