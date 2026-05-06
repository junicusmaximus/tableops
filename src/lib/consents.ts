export type ConsentType =
  | 'terms_of_service'
  | 'privacy_collection'
  | 'employee_attendance_data'
  | 'access_log_attendance'
  | 'electronic_document_signature'
  | 'notification_receive'
  | 'marketing_receive'
  | 'gps_attendance';

export interface ConsentDef {
  type: ConsentType;
  title: string;
  shortLabel: string;
  required: boolean;
  version: string;
  roleScope: string[];
  content: string;
}

const ALL_ROLES = ['ceo', 'owner', 'boss', 'manager', 'full_time', 'part_time'];
const STAFF_ROLES = ['full_time', 'part_time'];

export const CONSENT_DEFS: ConsentDef[] = [
  {
    type: 'terms_of_service',
    title: '서비스 이용약관 동의',
    shortLabel: '서비스 이용약관에 동의합니다.',
    required: true,
    version: 'v1',
    roleScope: ALL_ROLES,
    content: `TableOps 서비스 이용약관입니다.

본 약관은 TableOps(이하 "회사")가 제공하는 매장 운영관리 서비스의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임 사항을 규정합니다.

이용자는 본 약관에 동의함으로써 서비스를 이용할 수 있으며, 회사는 관련 법령을 준수하여 서비스를 제공합니다.

자세한 사항은 서비스 내 약관 전문에서 확인하실 수 있습니다.`,
  },
  {
    type: 'privacy_collection',
    title: '개인정보 수집·이용 동의',
    shortLabel: '회원가입 및 서비스 이용을 위한 개인정보 수집·이용에 동의합니다.',
    required: true,
    version: 'v1',
    roleScope: ALL_ROLES,
    content: `TableOps는 회원가입 및 서비스 제공을 위해 아래와 같은 개인정보를 수집·이용합니다.

1. 수집 항목
- 필수: 아이디, 비밀번호, 이름, 휴대전화번호, 직급, 매장 정보
- 선택: 이메일, 프로필 사진, 자기소개, 생년월일

2. 수집·이용 목적
- 회원가입 및 본인 확인
- 직원 프로필 관리
- 매장 운영관리 서비스 제공
- 권한 관리 및 보안 관리
- 고객 지원 및 서비스 이용 기록 관리

3. 보유 및 이용기간
- 회원 탈퇴 시까지 보관합니다.
- 단, 관련 법령 또는 내부 보관 정책에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보관할 수 있습니다.
- 보유기간이 경과하거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다.

4. 동의 거부 권리
- 이용자는 개인정보 수집·이용에 대한 동의를 거부할 수 있습니다.
- 다만 필수 항목에 대한 동의를 거부할 경우 회원가입 및 서비스 이용이 제한될 수 있습니다.`,
  },
  {
    type: 'employee_attendance_data',
    title: '근태 및 직원정보 수집·이용 동의',
    shortLabel: '직원 정보 및 근태기록의 수집·이용에 동의합니다.',
    required: true,
    version: 'v1',
    roleScope: STAFF_ROLES,
    content: `TableOps는 매장 운영 및 근태 관리를 위해 직원 정보와 근태기록을 수집·이용합니다.

1. 수집 항목
- 이름, 휴대전화번호, 직급, 매장, 입사일
- 스케줄 정보
- 출근 및 퇴근 기록
- 지각, 조퇴, 결근, 휴가 신청 및 승인/반려 기록
- 근무시간 및 근무 통계

2. 수집·이용 목적
- 직원 스케줄 관리
- 출퇴근 및 근무시간 확인
- 지각, 조퇴, 결근 등 근태 확인
- 휴가 신청 및 승인 관리
- 매장 인력 운영 및 근무 통계 관리
- 근태 관련 분쟁 예방 및 기록 확인

3. 보유 및 이용기간
- 재직 기간 동안 보관합니다.
- 퇴사 후에는 관련 법령 또는 내부 보관 정책에 따른 기간 동안 보관할 수 있습니다.
- 보관 목적이 달성되거나 보유기간이 경과한 경우 지체 없이 파기합니다.

4. 동의 거부 권리
- 이용자는 본 동의를 거부할 수 있습니다.
- 다만 근태관리 기능 제공을 위해 필요한 필수 정보이므로 동의하지 않을 경우 직원 계정 사용이 제한될 수 있습니다.`,
  },
  {
    type: 'access_log_attendance',
    title: '출입기록 연동 및 근태 활용 동의',
    shortLabel:
      '출입 시스템의 출입기록이 근태 확인 및 매장 운영 관리를 위해 TableOps에 연동·저장될 수 있음에 동의합니다.',
    required: true,
    version: 'v1',
    roleScope: STAFF_ROLES,
    content: `TableOps는 매장의 출입 시스템과 연동하여 직원 출입기록을 근태 확인 및 매장 운영 관리를 위해 수집·이용할 수 있습니다.

1. 수집 항목
- 출입 시스템 제공업체명
- 출입카드번호 또는 사번
- 출입 시스템 사용자 ID
- 출입 일시
- 출입문 또는 장치명
- 매장 또는 지점 정보
- 앱 내 출퇴근 기록과의 비교 결과
- 관리자 확인 및 수정 이력

2. 수집·이용 목적
- 출근 및 퇴근 기록 확인
- 지각, 조퇴, 결근 여부 확인
- 앱 출퇴근 기록 누락 여부 확인
- 실제 출입기록과 앱 근태기록 비교
- 근무시간 산정 보조
- 매장 보안 및 운영관리
- 근태 관련 분쟁 예방 및 증빙자료 관리

3. 보유 및 이용기간
- 재직 기간 동안 보관합니다.
- 퇴사 후에는 관련 법령 또는 내부 보관 정책에 따른 기간 동안 보관할 수 있습니다.
- 보유기간이 경과하거나 처리 목적이 달성되어 불필요해진 정보는 지체 없이 파기합니다.

4. 접근 권한
- 본인의 출입기록 및 근태기록은 본인이 확인할 수 있습니다.
- 대표, 사장님, 매니저 등 관리자 권한자는 담당 매장 범위 내에서 근태 확인 및 운영관리를 위해 열람할 수 있습니다.
- 권한 없는 사용자는 다른 직원의 출입기록을 열람할 수 없습니다.

5. 감사로그
- 출입기록 가져오기, 관리자 확인, 근태기록 수정, 예외 처리 등 주요 행위는 감사로그로 기록될 수 있습니다.

6. 동의 거부 권리
- 이용자는 본 동의를 거부할 수 있습니다.
- 다만 출입 시스템 연동 기반 근태 확인 기능 사용이 제한될 수 있습니다.`,
  },
  {
    type: 'electronic_document_signature',
    title: '전자문서 및 전자서명 이용 동의',
    shortLabel: '전자문서 작성, 전자서명, 문서 보관 및 서명기록 저장에 동의합니다.',
    required: true,
    version: 'v1',
    roleScope: ALL_ROLES,
    content: `TableOps는 근로계약서, 개인정보 동의서, 취업규칙 확인서, 교육 확인서 등 사내 문서를 전자문서 형태로 작성·보관하고, 전자서명을 통해 확인할 수 있는 기능을 제공합니다.

1. 수집 항목
- 전자문서 작성 및 열람 이력
- 전자서명 이미지 또는 이름 입력 서명
- 서명 시각
- 동의 여부 및 동의 시각
- 접속 정보
- 문서 버전 및 최종 문서 기록

2. 수집·이용 목적
- 전자문서 작성 및 보관
- 근로계약서 및 사내 문서 확인
- 전자서명 기록 관리
- 문서 열람 및 제출 이력 확인
- 분쟁 예방 및 증빙자료 관리

3. 보유 및 이용기간
- 문서의 보관 목적 및 관련 법령 또는 내부 보관 정책에 따른 기간 동안 보관할 수 있습니다.
- 보관 목적이 달성되거나 보유기간이 경과한 경우 지체 없이 파기합니다.

4. 동의 거부 권리
- 이용자는 전자문서 및 전자서명 이용에 대한 동의를 거부할 수 있습니다.
- 다만 동의하지 않을 경우 전자문서 작성 및 전자서명 기능 사용이 제한될 수 있습니다.`,
  },
  {
    type: 'notification_receive',
    title: '알림 수신 동의',
    shortLabel: '스케줄, 휴가, 전자문서, 공지 등 운영 알림 수신에 동의합니다.',
    required: false,
    version: 'v1',
    roleScope: ALL_ROLES,
    content: `TableOps는 매장 운영에 필요한 알림을 앱 내 알림, 푸시 알림, 문자 알림 등의 방식으로 발송할 수 있습니다.

알림 예시:
- 스케줄 등록 및 변경 알림
- 휴가 신청 및 승인/반려 알림
- 전자문서 서명 요청 알림
- 체크리스트 미완료 알림
- 재고 부족 및 발주 알림
- 공지사항 알림

이용자는 설정 화면에서 알림 수신 여부를 변경할 수 있습니다.`,
  },
  {
    type: 'marketing_receive',
    title: '마케팅 정보 수신 동의',
    shortLabel: '서비스 안내 및 마케팅 정보 수신에 동의합니다.',
    required: false,
    version: 'v1',
    roleScope: ALL_ROLES,
    content: `TableOps는 서비스 업데이트, 이벤트, 프로모션, 신규 기능 안내 등 마케팅 정보를 제공할 수 있습니다.

수신 방법:
- 앱 알림
- 문자
- 이메일

마케팅 정보 수신 동의는 선택 사항이며, 동의하지 않아도 서비스 이용에는 제한이 없습니다.

이용자는 언제든지 설정 화면에서 수신 동의를 철회할 수 있습니다.`,
  },
  {
    type: 'gps_attendance',
    title: '위치정보 기반 출퇴근 확인 동의',
    shortLabel: 'GPS 위치정보를 이용한 출퇴근 확인 기능 사용에 동의합니다.',
    required: false,
    version: 'v1',
    roleScope: ALL_ROLES,
    content: `TableOps는 GPS 기반 출퇴근 확인 기능을 사용하는 경우, 출퇴근 시점의 위치정보를 수집·이용할 수 있습니다.

1. 수집 항목
- 출근 또는 퇴근 시점의 위치정보
- 매장 기준 거리
- 출퇴근 시각
- 위치 확인 성공 또는 실패 여부

2. 수집·이용 목적
- 매장 내 또는 매장 인근 출퇴근 여부 확인
- 부정 출퇴근 방지
- 근태기록 신뢰성 향상

3. 보유 및 이용기간
- 근태관리 목적 달성 및 내부 보관 정책에 따른 기간 동안 보관할 수 있습니다.
- 보유기간이 경과하거나 처리 목적이 달성된 경우 지체 없이 파기합니다.

4. 동의 거부 권리
- 위치정보 기반 출퇴근 확인 동의는 선택 사항입니다.
- 동의하지 않아도 GPS를 사용하지 않는 방식의 출퇴근 기능은 이용할 수 있습니다.`,
  },
];

export const getConsentsForRole = (role: string | null | undefined): ConsentDef[] => {
  if (!role) return CONSENT_DEFS.filter((c) => c.roleScope.includes('part_time'));
  return CONSENT_DEFS.filter((c) => c.roleScope.includes(role));
};

export const getConsentDef = (type: ConsentType): ConsentDef | undefined =>
  CONSENT_DEFS.find((c) => c.type === type);

export const OPTIONAL_WITHDRAWABLE: ConsentType[] = [
  'marketing_receive',
  'gps_attendance',
  'notification_receive',
];
