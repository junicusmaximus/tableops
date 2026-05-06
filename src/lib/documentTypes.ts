// Shared types for the electronic document system

export type FieldType =
  | 'text_input'
  | 'date'
  | 'checkbox'
  | 'dropdown'
  | 'signature'
  | 'textarea';

export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'divider'
  | 'field';

export interface FieldBlock {
  id: string;
  type: 'field';
  fieldType: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  helperText?: string;
  options?: string[]; // for dropdown
  defaultValue?: string;
  assignedTo?: 'recipient' | 'sender';
}

export interface TextBlock {
  id: string;
  type: 'heading' | 'paragraph';
  text: string;
  level?: 1 | 2 | 3;
}

export interface DividerBlock {
  id: string;
  type: 'divider';
}

export type DocumentBlock = FieldBlock | TextBlock | DividerBlock;

export interface DocumentSchema {
  blocks: DocumentBlock[];
}

export const SMART_VARIABLES = [
  '{{회사명}}',
  '{{매장명}}',
  '{{직원명}}',
  '{{직급}}',
  '{{휴대전화번호}}',
  '{{입사일}}',
  '{{근무장소}}',
  '{{시급}}',
  '{{월급}}',
  '{{계약시작일}}',
  '{{계약종료일}}',
  '{{작성일}}',
] as const;

export const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  draft: '임시저장',
  sent: '서명 요청됨',
  viewed: '열람 완료',
  in_progress: '작성 중',
  completed: '서명 완료',
  rejected: '반려',
  expired: '만료',
  cancelled: '취소됨',
};

export const DOCUMENT_STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'destructive' | 'info' | 'default'> = {
  draft: 'default',
  sent: 'warning',
  viewed: 'info',
  in_progress: 'info',
  completed: 'success',
  rejected: 'destructive',
  expired: 'destructive',
  cancelled: 'destructive',
};

export const CONSENT_TEXT = `본인은 본 전자문서의 내용을 확인하였으며, 전자서명을 통해 이에 동의합니다.

또한 본 전자서명 및 관련 문서 정보, 서명 시각, 접속 정보, 서명 기록이 어플리케이션 내에 저장·보관될 수 있음에 동의합니다.

전자서명 완료 후 관련 기록은 법령 및 내부 보관 정책에 따라 저장될 수 있습니다.`;

export const CONSENT_VERSION = 'v1';

// Replace smart variables in a text block using a context map
export function applySmartVariables(text: string, ctx: Record<string, string>): string {
  return text.replace(/\{\{([^}]+)\}\}/g, (_, key) => ctx[key.trim()] ?? `{{${key}}}`);
}

// Build smart variable context from sender/recipient/store profile data
export interface SmartContext {
  회사명?: string;
  매장명?: string;
  직원명?: string;
  직급?: string;
  휴대전화번호?: string;
  입사일?: string;
  근무장소?: string;
  시급?: string;
  월급?: string;
  계약시작일?: string;
  계약종료일?: string;
  작성일?: string;
}

// Hash document version (for audit)
export async function hashDocument(content: string): Promise<string> {
  const enc = new TextEncoder().encode(content);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
