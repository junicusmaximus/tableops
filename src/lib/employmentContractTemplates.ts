// Built-in employment contract templates (system templates)
import type { DocumentSchema } from './documentTypes';

export type ContractType = 'full_time' | 'fixed_term' | 'part_time';

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  full_time: '정직원 근로계약서',
  fixed_term: '계약직 근로계약서',
  part_time: '파트타이머 / 단시간 근로계약서',
};

const commonHeader = (title: string) => [
  { id: 'h1', type: 'heading' as const, text: title, level: 1 as const },
  {
    id: 'p_intro',
    type: 'paragraph' as const,
    text: '{{회사명}}(이하 "사업주"라 함)와(과) {{직원명}}(이하 "근로자"라 함)은 다음과 같이 근로계약을 체결한다.',
  },
  { id: 'd_intro', type: 'divider' as const },
];

const employerSection = [
  { id: 'h_emp', type: 'heading' as const, text: '1. 사업주(회사) 정보', level: 2 as const },
  { id: 'p_emp_1', type: 'paragraph' as const, text: '회사명: {{회사명}}' },
  { id: 'p_emp_2', type: 'paragraph' as const, text: '대표자명: {{대표자명}}' },
  { id: 'p_emp_3', type: 'paragraph' as const, text: '사업자등록번호: {{사업자등록번호}}' },
  { id: 'p_emp_4', type: 'paragraph' as const, text: '사업장 주소: {{사업장주소}}' },
  { id: 'p_emp_5', type: 'paragraph' as const, text: '매장명: {{매장명}}' },
  { id: 'p_emp_6', type: 'paragraph' as const, text: '연락처: {{회사연락처}}' },
];

const workerSection = [
  { id: 'h_w', type: 'heading' as const, text: '2. 근로자 정보', level: 2 as const },
  { id: 'p_w_1', type: 'paragraph' as const, text: '성명: {{직원명}}' },
  { id: 'p_w_2', type: 'paragraph' as const, text: '휴대전화번호: {{휴대전화번호}}' },
  { id: 'p_w_3', type: 'paragraph' as const, text: '직급: {{직급}}' },
  { id: 'p_w_4', type: 'paragraph' as const, text: '근무 형태: {{근무형태}}' },
];

const signatureSection = [
  { id: 'd_sig', type: 'divider' as const },
  {
    id: 'f_date',
    type: 'field' as const,
    fieldType: 'date' as const,
    label: '작성일',
    required: true,
    assignedTo: 'recipient' as const,
    defaultValue: '{{작성일}}',
  },
  {
    id: 'f_consent_terms',
    type: 'field' as const,
    fieldType: 'checkbox' as const,
    label: '본 근로계약서의 모든 내용을 확인하였으며 이에 동의합니다',
    required: true,
    assignedTo: 'recipient' as const,
  },
  {
    id: 'sig',
    type: 'field' as const,
    fieldType: 'signature' as const,
    label: '근로자 서명',
    required: true,
    assignedTo: 'recipient' as const,
  },
];

export const EMPLOYMENT_CONTRACT_TEMPLATES: Record<ContractType, DocumentSchema> = {
  full_time: {
    blocks: [
      ...commonHeader('정직원 근로계약서'),
      ...employerSection,
      ...workerSection,
      { id: 'h_c', type: 'heading', text: '3. 계약 정보', level: 2 },
      { id: 'p_c_1', type: 'paragraph', text: '계약 유형: 기간의 정함이 없는 근로계약 (정규직)' },
      { id: 'p_c_2', type: 'paragraph', text: '입사일(근로 개시일): {{입사일}}' },
      { id: 'p_c_3', type: 'paragraph', text: '수습기간: {{수습기간}}' },
      { id: 'h_d', type: 'heading', text: '4. 업무 정보', level: 2 },
      { id: 'p_d_1', type: 'paragraph', text: '근무 장소: {{근무장소}}' },
      { id: 'p_d_2', type: 'paragraph', text: '직무: {{직무}}' },
      { id: 'f_duty', type: 'field', fieldType: 'textarea', label: '업무 내용', required: true, assignedTo: 'sender', placeholder: '담당 업무를 입력하세요' },
      { id: 'h_e', type: 'heading', text: '5. 근로시간', level: 2 },
      { id: 'p_e_1', type: 'paragraph', text: '근무일: 주 5일 (월~금)' },
      { id: 'p_e_2', type: 'paragraph', text: '근무시간: 09:00 ~ 18:00 (휴게시간 12:00 ~ 13:00, 1시간)' },
      { id: 'p_e_3', type: 'paragraph', text: '주 소정근로시간: 40시간' },
      { id: 'h_f', type: 'heading', text: '6. 임금', level: 2 },
      { id: 'p_f_1', type: 'paragraph', text: '임금 유형: 월급' },
      { id: 'p_f_2', type: 'paragraph', text: '월급: {{월급}}원' },
      { id: 'p_f_3', type: 'paragraph', text: '지급일: 매월 25일' },
      { id: 'p_f_4', type: 'paragraph', text: '지급 방법: 근로자 명의 계좌 이체' },
      { id: 'h_g', type: 'heading', text: '7. 휴일 / 휴가', level: 2 },
      { id: 'p_g_1', type: 'paragraph', text: '주휴일: 일요일 (1주간 소정근로일을 개근한 경우 유급 주휴 부여)' },
      { id: 'p_g_2', type: 'paragraph', text: '연차유급휴가: 근로기준법에 따라 부여' },
      { id: 'h_h', type: 'heading', text: '8. 기타', level: 2 },
      { id: 'p_h_1', type: 'paragraph', text: '본 계약서에 명시되지 않은 사항은 근로기준법 및 회사 취업규칙에 따른다.' },
      { id: 'f_etc', type: 'field', fieldType: 'textarea', label: '기타 특약사항', required: false, assignedTo: 'sender' },
      ...signatureSection,
    ],
  },
  fixed_term: {
    blocks: [
      ...commonHeader('계약직 근로계약서'),
      ...employerSection,
      ...workerSection,
      { id: 'h_c', type: 'heading', text: '3. 계약 정보', level: 2 },
      { id: 'p_c_1', type: 'paragraph', text: '계약 유형: 기간의 정함이 있는 근로계약 (계약직)' },
      { id: 'p_c_2', type: 'paragraph', text: '계약 시작일: {{계약시작일}}' },
      { id: 'p_c_3', type: 'paragraph', text: '계약 종료일: {{계약종료일}}' },
      { id: 'p_c_4', type: 'paragraph', text: '입사일: {{입사일}}' },
      { id: 'h_d', type: 'heading', text: '4. 업무 정보', level: 2 },
      { id: 'p_d_1', type: 'paragraph', text: '근무 장소: {{근무장소}}' },
      { id: 'p_d_2', type: 'paragraph', text: '직무: {{직무}}' },
      { id: 'f_duty', type: 'field', fieldType: 'textarea', label: '업무 내용', required: true, assignedTo: 'sender' },
      { id: 'h_e', type: 'heading', text: '5. 근로시간', level: 2 },
      { id: 'p_e_1', type: 'paragraph', text: '근무일: 주 5일' },
      { id: 'p_e_2', type: 'paragraph', text: '근무시간: 09:00 ~ 18:00 (휴게시간 1시간 포함)' },
      { id: 'h_f', type: 'heading', text: '6. 임금', level: 2 },
      { id: 'p_f_1', type: 'paragraph', text: '월급: {{월급}}원' },
      { id: 'p_f_2', type: 'paragraph', text: '지급일: 매월 25일 / 지급방법: 계좌이체' },
      { id: 'h_g', type: 'heading', text: '7. 휴일 / 휴가', level: 2 },
      { id: 'p_g_1', type: 'paragraph', text: '주휴일 및 연차유급휴가는 근로기준법에 따른다.' },
      { id: 'h_h', type: 'heading', text: '8. 기타', level: 2 },
      { id: 'p_h_1', type: 'paragraph', text: '계약기간 만료 시 본 계약은 자동 종료되며, 별도의 합의에 의해 갱신될 수 있다.' },
      { id: 'f_etc', type: 'field', fieldType: 'textarea', label: '기타 특약사항', required: false, assignedTo: 'sender' },
      ...signatureSection,
    ],
  },
  part_time: {
    blocks: [
      ...commonHeader('파트타이머 / 단시간 근로계약서'),
      ...employerSection,
      ...workerSection,
      { id: 'h_c', type: 'heading', text: '3. 계약 정보', level: 2 },
      { id: 'p_c_1', type: 'paragraph', text: '계약 유형: 단시간(파트타이머) 근로계약' },
      { id: 'p_c_2', type: 'paragraph', text: '계약 시작일: {{계약시작일}}' },
      { id: 'p_c_3', type: 'paragraph', text: '계약 종료일: {{계약종료일}}' },
      { id: 'h_d', type: 'heading', text: '4. 업무 정보', level: 2 },
      { id: 'p_d_1', type: 'paragraph', text: '근무 장소: {{근무장소}}' },
      { id: 'p_d_2', type: 'paragraph', text: '직무: {{직무}}' },
      { id: 'f_duty', type: 'field', fieldType: 'textarea', label: '업무 내용', required: true, assignedTo: 'sender' },
      { id: 'h_e', type: 'heading', text: '5. 근로시간 (단시간)', level: 2 },
      { id: 'f_days', type: 'field', fieldType: 'text_input', label: '근무 요일', required: true, assignedTo: 'sender', placeholder: '예: 월, 수, 금' },
      { id: 'f_start', type: 'field', fieldType: 'text_input', label: '근무 시작 시간', required: true, assignedTo: 'sender', placeholder: '예: 17:00' },
      { id: 'f_end', type: 'field', fieldType: 'text_input', label: '근무 종료 시간', required: true, assignedTo: 'sender', placeholder: '예: 22:00' },
      { id: 'f_break', type: 'field', fieldType: 'text_input', label: '휴게 시간(분)', required: false, assignedTo: 'sender', placeholder: '예: 30' },
      { id: 'f_weekly', type: 'field', fieldType: 'text_input', label: '주 소정근로시간', required: true, assignedTo: 'sender', placeholder: '예: 15시간' },
      { id: 'h_f', type: 'heading', text: '6. 임금', level: 2 },
      { id: 'p_f_1', type: 'paragraph', text: '임금 유형: 시급' },
      { id: 'p_f_2', type: 'paragraph', text: '시급: {{시급}}원' },
      { id: 'p_f_3', type: 'paragraph', text: '지급일: 매월 25일 / 지급방법: 계좌이체' },
      { id: 'p_f_4', type: 'paragraph', text: '주 15시간 이상 근무 시 주휴수당 지급, 미만 시 미지급.' },
      { id: 'h_g', type: 'heading', text: '7. 기타', level: 2 },
      { id: 'p_g_1', type: 'paragraph', text: '본 계약서에 명시되지 않은 사항은 근로기준법에 따른다.' },
      { id: 'f_etc', type: 'field', fieldType: 'textarea', label: '기타 특약사항', required: false, assignedTo: 'sender' },
      ...signatureSection,
    ],
  },
};

export interface ContractSmartContext {
  회사명: string;
  대표자명: string;
  사업자등록번호: string;
  사업장주소: string;
  매장명: string;
  회사연락처: string;
  직원명: string;
  휴대전화번호: string;
  직급: string;
  근무형태: string;
  입사일: string;
  근무장소: string;
  직무: string;
  시급: string;
  월급: string;
  계약시작일: string;
  계약종료일: string;
  수습기간: string;
  작성일: string;
}

export const REQUIRED_AUTOFILL_KEYS: (keyof ContractSmartContext)[] = [
  '회사명',
  '매장명',
  '직원명',
  '휴대전화번호',
];
