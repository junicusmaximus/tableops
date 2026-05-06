// Smart variable system for electronic documents

export type SourceType =
  | 'auto_company'
  | 'auto_store'
  | 'auto_employee'
  | 'manual_sender'
  | 'manual_recipient'
  | 'signed_at_auto'
  | 'document_meta'
  | 'default'
  | 'custom';

export type InputType = 'text' | 'long_text' | 'number' | 'date' | 'time' | 'checkbox' | 'dropdown';
export type EditableBy = 'sender' | 'recipient' | 'auto' | 'both';

export interface SmartVariableConfig {
  variable_key: string; // includes {{ }}
  display_name: string;
  description?: string;
  source_type: SourceType;
  source_table?: string;
  source_column?: string;
  input_type: InputType;
  required: boolean;
  default_value?: string;
  editable_by: EditableBy;
  allow_manual_override: boolean;
  validation_rule?: { pattern?: string; min?: number; max?: number; options?: string[] };
  is_custom: boolean;
  category: string;
}

export const VARIABLE_CATEGORIES = [
  '회사 정보',
  '매장 정보',
  '직원 정보',
  '계약 정보',
  '근무 정보',
  '급여 정보',
  '문서 정보',
  '커스텀 변수',
] as const;

export const SOURCE_LABELS: Record<SourceType, string> = {
  auto_company: '회사 정보 자동 입력',
  auto_store: '매장 정보 자동 입력',
  auto_employee: '직원 프로필 자동 입력',
  manual_sender: '문서 작성자 직접 입력',
  manual_recipient: '직원이 작성 시 입력',
  signed_at_auto: '서명 완료 시 자동 입력',
  document_meta: '문서 메타 자동 입력',
  default: '기본값 사용',
  custom: '커스텀 변수',
};

export const EDITABLE_BY_LABELS: Record<EditableBy, string> = {
  sender: '관리자 입력',
  recipient: '직원 입력',
  auto: '자동 입력',
  both: '양쪽 모두',
};

export const INPUT_TYPE_LABELS: Record<InputType, string> = {
  text: '단답',
  long_text: '장문',
  number: '숫자',
  date: '날짜',
  time: '시간',
  checkbox: '체크박스',
  dropdown: '드롭다운',
};

// Built-in system variable catalog
export const SYSTEM_VARIABLES: SmartVariableConfig[] = [
  // 회사
  { variable_key: '{{회사명}}', display_name: '회사명', source_type: 'auto_company', source_table: 'organizations', source_column: 'name', input_type: 'text', required: false, editable_by: 'auto', allow_manual_override: true, is_custom: false, category: '회사 정보' },
  { variable_key: '{{대표자명}}', display_name: '대표자명', source_type: 'manual_sender', input_type: 'text', required: false, editable_by: 'sender', allow_manual_override: true, is_custom: false, category: '회사 정보' },
  { variable_key: '{{사업자등록번호}}', display_name: '사업자등록번호', source_type: 'manual_sender', input_type: 'text', required: false, editable_by: 'sender', allow_manual_override: true, is_custom: false, category: '회사 정보' },
  // 매장
  { variable_key: '{{매장명}}', display_name: '매장명', source_type: 'auto_store', source_table: 'stores', source_column: 'name', input_type: 'text', required: false, editable_by: 'auto', allow_manual_override: true, is_custom: false, category: '매장 정보' },
  { variable_key: '{{매장주소}}', display_name: '매장주소', source_type: 'auto_store', source_table: 'stores', source_column: 'address', input_type: 'text', required: false, editable_by: 'auto', allow_manual_override: true, is_custom: false, category: '매장 정보' },
  { variable_key: '{{매장전화번호}}', display_name: '매장전화번호', source_type: 'auto_store', source_table: 'stores', source_column: 'phone', input_type: 'text', required: false, editable_by: 'auto', allow_manual_override: true, is_custom: false, category: '매장 정보' },
  // 직원
  { variable_key: '{{직원명}}', display_name: '직원명', source_type: 'auto_employee', source_table: 'employee_profiles', source_column: 'full_name', input_type: 'text', required: true, editable_by: 'auto', allow_manual_override: true, is_custom: false, category: '직원 정보' },
  { variable_key: '{{직급}}', display_name: '직급', source_type: 'auto_employee', source_table: 'employee_profiles', source_column: 'position', input_type: 'text', required: false, editable_by: 'auto', allow_manual_override: true, is_custom: false, category: '직원 정보' },
  { variable_key: '{{휴대전화번호}}', display_name: '휴대전화번호', source_type: 'auto_employee', source_table: 'employee_profiles', source_column: 'phone', input_type: 'text', required: false, editable_by: 'auto', allow_manual_override: true, is_custom: false, category: '직원 정보' },
  { variable_key: '{{생년월일}}', display_name: '생년월일', source_type: 'manual_recipient', input_type: 'date', required: false, editable_by: 'recipient', allow_manual_override: true, is_custom: false, category: '직원 정보' },
  { variable_key: '{{입사일}}', display_name: '입사일', source_type: 'auto_employee', source_table: 'employee_profiles', source_column: 'hire_date', input_type: 'date', required: false, editable_by: 'auto', allow_manual_override: true, is_custom: false, category: '직원 정보' },
  // 계약
  { variable_key: '{{계약시작일}}', display_name: '계약시작일', source_type: 'manual_sender', input_type: 'date', required: true, editable_by: 'sender', allow_manual_override: true, is_custom: false, category: '계약 정보' },
  { variable_key: '{{계약종료일}}', display_name: '계약종료일', source_type: 'manual_sender', input_type: 'date', required: false, editable_by: 'sender', allow_manual_override: true, is_custom: false, category: '계약 정보' },
  { variable_key: '{{근무장소}}', display_name: '근무장소', source_type: 'auto_store', source_table: 'stores', source_column: 'address', input_type: 'text', required: false, editable_by: 'auto', allow_manual_override: true, is_custom: false, category: '계약 정보' },
  // 급여
  { variable_key: '{{시급}}', display_name: '시급', source_type: 'manual_sender', input_type: 'number', required: false, editable_by: 'sender', allow_manual_override: true, is_custom: false, category: '급여 정보' },
  { variable_key: '{{월급}}', display_name: '월급', source_type: 'manual_sender', input_type: 'number', required: false, editable_by: 'sender', allow_manual_override: true, is_custom: false, category: '급여 정보' },
  // 근무
  { variable_key: '{{근무요일}}', display_name: '근무요일', source_type: 'manual_sender', input_type: 'text', required: false, editable_by: 'sender', allow_manual_override: true, is_custom: false, category: '근무 정보' },
  { variable_key: '{{근무시작시간}}', display_name: '근무시작시간', source_type: 'manual_sender', input_type: 'time', required: false, editable_by: 'sender', allow_manual_override: true, is_custom: false, category: '근무 정보' },
  { variable_key: '{{근무종료시간}}', display_name: '근무종료시간', source_type: 'manual_sender', input_type: 'time', required: false, editable_by: 'sender', allow_manual_override: true, is_custom: false, category: '근무 정보' },
  { variable_key: '{{휴게시간}}', display_name: '휴게시간', source_type: 'manual_sender', input_type: 'text', required: false, editable_by: 'sender', allow_manual_override: true, is_custom: false, category: '근무 정보' },
  { variable_key: '{{업무내용}}', display_name: '업무내용', source_type: 'manual_sender', input_type: 'long_text', required: false, editable_by: 'sender', allow_manual_override: true, is_custom: false, category: '근무 정보' },
  // 문서
  { variable_key: '{{작성일}}', display_name: '작성일', source_type: 'document_meta', input_type: 'date', required: false, editable_by: 'auto', allow_manual_override: false, is_custom: false, category: '문서 정보' },
  { variable_key: '{{서명일}}', display_name: '서명일', source_type: 'signed_at_auto', input_type: 'date', required: false, editable_by: 'auto', allow_manual_override: false, is_custom: false, category: '문서 정보' },
  { variable_key: '{{문서명}}', display_name: '문서명', source_type: 'document_meta', input_type: 'text', required: false, editable_by: 'auto', allow_manual_override: false, is_custom: false, category: '문서 정보' },
  { variable_key: '{{문서번호}}', display_name: '문서번호', source_type: 'document_meta', input_type: 'text', required: false, editable_by: 'auto', allow_manual_override: false, is_custom: false, category: '문서 정보' },
];

export function findSystemVariable(key: string): SmartVariableConfig | undefined {
  return SYSTEM_VARIABLES.find((v) => v.variable_key === key);
}

// Extract {{var}} keys from text
export function extractVariableKeys(text: string): string[] {
  const result: string[] = [];
  const re = /\{\{[^}]+\}\}/g;
  let m;
  while ((m = re.exec(text)) !== null) result.push(m[0]);
  return result;
}

// Resolve smart variables in text based on configured variables and context values
export function resolveText(text: string, ctx: Record<string, string>): string {
  return text.replace(/\{\{[^}]+\}\}/g, (m) => ctx[m] ?? m);
}

// Build sample context for preview
export function buildSampleContext(variables: SmartVariableConfig[]): Record<string, string> {
  const samples: Record<string, string> = {
    '{{회사명}}': '예시 회사',
    '{{대표자명}}': '홍길동',
    '{{사업자등록번호}}': '123-45-67890',
    '{{매장명}}': '강남 1호점',
    '{{매장주소}}': '서울시 강남구 테헤란로 123',
    '{{매장전화번호}}': '02-1234-5678',
    '{{직원명}}': '김민수',
    '{{직급}}': '홀 스태프',
    '{{휴대전화번호}}': '010-1234-5678',
    '{{생년월일}}': '1995-03-15',
    '{{입사일}}': '2024-01-10',
    '{{근무장소}}': '강남 1호점',
    '{{시급}}': '12,000원',
    '{{월급}}': '2,400,000원',
    '{{계약시작일}}': '2025-01-01',
    '{{계약종료일}}': '2025-12-31',
    '{{근무요일}}': '월·화·수·목·금',
    '{{근무시작시간}}': '09:00',
    '{{근무종료시간}}': '18:00',
    '{{휴게시간}}': '60분',
    '{{업무내용}}': '홀 서빙 및 고객 응대',
    '{{작성일}}': new Date().toISOString().slice(0, 10),
    '{{서명일}}': new Date().toISOString().slice(0, 10),
    '{{문서명}}': '근로계약서',
    '{{문서번호}}': 'DOC-2025-0001',
  };
  const ctx: Record<string, string> = { ...samples };
  for (const v of variables) {
    if (v.default_value) ctx[v.variable_key] = v.default_value;
    if (!ctx[v.variable_key]) ctx[v.variable_key] = `[${v.display_name} 샘플]`;
  }
  return ctx;
}

// Build context from real data sources (sender + recipient profile + store + org)
export interface ResolveSources {
  organization?: { name?: string | null };
  store?: { name?: string | null; address?: string | null; phone?: string | null };
  recipient?: { full_name?: string | null; position?: string | null; phone?: string | null; hire_date?: string | null };
  documentTitle?: string;
  manualOverrides?: Record<string, string>;
}

export function buildRealContext(variables: SmartVariableConfig[], src: ResolveSources): Record<string, string> {
  const ctx: Record<string, string> = {};
  for (const v of variables) {
    let val: string | undefined;
    switch (v.source_type) {
      case 'auto_company':
        if (v.variable_key === '{{회사명}}') val = src.organization?.name ?? undefined;
        break;
      case 'auto_store':
        if (v.variable_key === '{{매장명}}') val = src.store?.name ?? undefined;
        else if (v.variable_key === '{{매장주소}}' || v.variable_key === '{{근무장소}}') val = src.store?.address ?? undefined;
        else if (v.variable_key === '{{매장전화번호}}') val = src.store?.phone ?? undefined;
        break;
      case 'auto_employee':
        if (v.variable_key === '{{직원명}}') val = src.recipient?.full_name ?? undefined;
        else if (v.variable_key === '{{직급}}') val = src.recipient?.position ?? undefined;
        else if (v.variable_key === '{{휴대전화번호}}') val = src.recipient?.phone ?? undefined;
        else if (v.variable_key === '{{입사일}}') val = src.recipient?.hire_date ?? undefined;
        break;
      case 'document_meta':
        if (v.variable_key === '{{작성일}}') val = new Date().toISOString().slice(0, 10);
        else if (v.variable_key === '{{문서명}}') val = src.documentTitle;
        else if (v.variable_key === '{{문서번호}}') val = `DOC-${Date.now().toString(36).toUpperCase()}`;
        break;
      case 'signed_at_auto':
        val = '(서명 시점에 자동 입력)';
        break;
      default:
        break;
    }
    if (!val && v.default_value) val = v.default_value;
    if (src.manualOverrides?.[v.variable_key]) val = src.manualOverrides[v.variable_key];
    if (val) ctx[v.variable_key] = val;
  }
  return ctx;
}

// Validate: returns missing required keys + unconfigured keys used in body
export interface ValidationResult {
  missingRequired: SmartVariableConfig[];
  unconfiguredUsed: string[];
  ok: boolean;
}

export function validateVariables(
  bodyText: string,
  configured: SmartVariableConfig[],
  ctx: Record<string, string>,
): ValidationResult {
  const used = Array.from(new Set(extractVariableKeys(bodyText)));
  const cfgMap = new Map(configured.map((c) => [c.variable_key, c]));
  const unconfiguredUsed = used.filter((k) => !cfgMap.has(k));
  const missingRequired = configured.filter(
    (v) => v.required && !ctx[v.variable_key] && !v.default_value && v.source_type !== 'signed_at_auto',
  );
  return {
    missingRequired,
    unconfiguredUsed,
    ok: missingRequired.length === 0 && unconfiguredUsed.length === 0,
  };
}
