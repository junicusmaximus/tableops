import type { DocumentSchema } from './documentTypes';

export const SEED_TEMPLATES: Array<{
  title: string;
  category: string;
  description: string;
  schema: DocumentSchema;
}> = [
  {
    title: '근로계약서',
    category: '계약서',
    description: '표준 근로계약서 (표준양식 기반)',
    schema: {
      blocks: [
        { id: 'h1', type: 'heading', text: '근로계약서', level: 1 },
        { id: 'p1', type: 'paragraph', text: '{{회사명}}(이하 "사용자"라 함)와 {{직원명}}(이하 "근로자"라 함)은 다음과 같이 근로계약을 체결한다.' },
        { id: 'd1', type: 'divider' },
        { id: 'p2', type: 'paragraph', text: '1. 근로 개시일: {{계약시작일}}' },
        { id: 'p3', type: 'paragraph', text: '2. 근무 장소: {{근무장소}}' },
        { id: 'f1', type: 'field', fieldType: 'textarea', label: '업무 내용', required: true, assignedTo: 'recipient', placeholder: '담당 업무를 입력하세요' },
        { id: 'p4', type: 'paragraph', text: '3. 근로일 및 근로시간: 주 5일, 1일 8시간 (휴게시간 1시간 포함)' },
        { id: 'p5', type: 'paragraph', text: '4. 임금: 시급 {{시급}}원 / 월급 {{월급}}원' },
        { id: 'p6', type: 'paragraph', text: '5. 임금 지급일: 매월 25일' },
        { id: 'p7', type: 'paragraph', text: '6. 휴일 및 연차유급휴가: 근로기준법에 따름' },
        { id: 'f2', type: 'field', fieldType: 'textarea', label: '기타 근로조건', required: false, assignedTo: 'recipient' },
        { id: 'd2', type: 'divider' },
        { id: 'f3', type: 'field', fieldType: 'date', label: '작성일', required: true, assignedTo: 'recipient', defaultValue: '{{작성일}}' },
        { id: 'sig', type: 'field', fieldType: 'signature', label: '근로자 서명', required: true, assignedTo: 'recipient' },
      ],
    },
  },
  {
    title: '개인정보 및 전자서명 동의서',
    category: '동의서',
    description: '개인정보 수집·이용 및 전자서명 동의서',
    schema: {
      blocks: [
        { id: 'h1', type: 'heading', text: '개인정보 및 전자서명 동의서', level: 1 },
        { id: 'p1', type: 'paragraph', text: '본인은 {{회사명}}이(가) 본인의 개인정보를 수집·이용하고, 전자문서 및 전자서명을 활용하는 것에 대하여 다음과 같이 동의합니다.' },
        { id: 'd1', type: 'divider' },
        { id: 'p2', type: 'paragraph', text: '1. 개인정보 수집·이용 항목: 성명, 연락처, 직무, 근무 정보' },
        { id: 'p3', type: 'paragraph', text: '2. 수집·이용 목적: 인사 관리 및 근로계약 이행' },
        { id: 'p4', type: 'paragraph', text: '3. 보관 기간: 관련 법령에 따른 보관 기간' },
        { id: 'f1', type: 'field', fieldType: 'checkbox', label: '개인정보 수집·이용에 동의합니다', required: true, assignedTo: 'recipient' },
        { id: 'f2', type: 'field', fieldType: 'checkbox', label: '전자문서 작성 및 보관에 동의합니다', required: true, assignedTo: 'recipient' },
        { id: 'f3', type: 'field', fieldType: 'checkbox', label: '전자서명 이용에 동의합니다', required: true, assignedTo: 'recipient' },
        { id: 'd2', type: 'divider' },
        { id: 'f4', type: 'field', fieldType: 'date', label: '동의일', required: true, assignedTo: 'recipient', defaultValue: '{{작성일}}' },
        { id: 'sig', type: 'field', fieldType: 'signature', label: '직원 서명', required: true, assignedTo: 'recipient' },
      ],
    },
  },
  {
    title: '보건증 제출 확인서',
    category: '확인서',
    description: '보건증 제출 여부 확인 및 서명',
    schema: {
      blocks: [
        { id: 'h1', type: 'heading', text: '보건증 제출 확인서', level: 1 },
        { id: 'p1', type: 'paragraph', text: '본인 {{직원명}}은(는) {{매장명}}에서 근무하기 위한 보건증을 제출하였음을 확인합니다.' },
        { id: 'f1', type: 'field', fieldType: 'date', label: '보건증 발급일', required: true, assignedTo: 'recipient' },
        { id: 'f2', type: 'field', fieldType: 'date', label: '보건증 만료일', required: true, assignedTo: 'recipient' },
        { id: 'f3', type: 'field', fieldType: 'checkbox', label: '보건증 사본을 매장에 제출하였습니다', required: true, assignedTo: 'recipient' },
        { id: 'd1', type: 'divider' },
        { id: 'sig', type: 'field', fieldType: 'signature', label: '직원 서명', required: true, assignedTo: 'recipient' },
      ],
    },
  },
];
