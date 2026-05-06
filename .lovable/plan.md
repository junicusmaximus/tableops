## 전자문서 템플릿 빌더 고도화 — 구현 계획

전자문서 템플릿을 **5단계 위저드**로 재구성하고, **스마트변수 설정 시스템**과 **템플릿 버전 관리**를 추가합니다.

---

### 1. 데이터베이스 변경

**새 테이블**
- `document_template_versions` — 템플릿 버전 스냅샷 저장
  - `template_id`, `version_number`, `template_schema`, `smart_variable_schema`, `status` (draft/active/archived), `created_by`
- `document_smart_variables` — 버전별 스마트변수 정의
  - `template_version_id`, `variable_key`, `display_name`, `description`, `source_type`, `source_table/column`, `input_type`, `required`, `default_value`, `editable_by`, `allow_manual_override`, `validation_rule`

**기존 테이블 변경**
- `document_templates`: `active_version_id` 추가
- `document_requests`: `template_version_id`, `variable_values_snapshot`, `document_schema_snapshot` 추가 (서명 시점 잠금 보장)

**RLS**: 기존 `document_templates` 패턴 그대로 — store 멤버 + manager 이상.

---

### 2. 스마트변수 시스템 (`src/lib/smartVariables.ts`)

8개 카테고리로 그룹화된 **시스템 변수 카탈로그**:
- 회사 정보 (회사명, 대표자명, 사업자등록번호)
- 매장 정보 (매장명, 매장주소, 매장전화번호)
- 직원 정보 (직원명, 직급, 휴대전화번호, 생년월일, 입사일)
- 계약 정보 (계약시작일, 계약종료일, 시급, 월급)
- 근무 정보 (근무요일, 근무시작/종료시간, 휴게시간, 업무내용, 근무장소)
- 문서 정보 (작성일, 서명일, 문서명, 문서번호)
- 커스텀 변수

각 변수는 `source_type` (auto_company / auto_store / auto_employee / manual_sender / manual_recipient / signed_at_auto / default / custom), `editable_by`, `required`, `validation_rule` 등을 포함.

`resolveSmartVariables(schema, ctx)` 함수로 미리보기/전송 시 실제 값 매핑.

---

### 3. 5단계 위저드 (`src/pages/DocumentBuilder.tsx` 재작성)

```text
[1 기본정보] → [2 스마트변수 설정] → [3 본문 편집] → [4 미리보기] → [5 저장/전송]
```

- **Step 1 — 기본정보**: 제목, 카테고리, 설명, 대상, 상태
- **Step 2 — 스마트변수 설정** (`SmartVariableConfig.tsx`): 시스템 변수 토글 + 커스텀 변수 추가 폼. 각 변수의 데이터 출처/필수/기본값/입력권한 설정
- **Step 3 — 본문 편집**: 기존 블록 에디터 + 좌측에 **카테고리별 그룹·검색 가능한 변수 패널**. 미설정 변수 사용 시 경고 배지
- **Step 4 — 미리보기** (`TemplatePreview.tsx`): 샘플 데이터 vs 실제 직원 선택. 미해결 변수 하이라이트
- **Step 5 — 저장/전송**: 임시저장 / 템플릿 저장 / 서명 요청. 필수 변수 누락 시 전송 차단

---

### 4. 템플릿 편집 & 버전 관리

**Documents.tsx 카드 액션**: 템플릿 수정 / 복제 / 미리보기 / 새 버전으로 저장 / 비활성화 / 보관

**버전 규칙**:
- `draft` 버전 → 직접 수정
- `active` 버전이 한 번이라도 사용됨 → 수정 시 자동 새 버전 생성, 안내 메시지: "이미 사용된 템플릿입니다. 수정 사항은 새 버전으로 저장됩니다."
- 활성 버전을 `active_version_id`로 가리킴

**Hook**: `useTemplateVersions`, `useDuplicateTemplate`, `useSaveAsNewVersion`

---

### 5. 최종 문서 보호

`useSendDocument` 변경: 전송 시 `template_version_id`, 현재 schema, 해석된 변수값 모두 `document_requests`에 스냅샷. 이후 템플릿 수정과 무관하게 서명 문서는 원본 보존.

---

### 6. 검증 로직 (`validateSmartVariables`)

전송 직전 실행:
- 필수 변수가 정의되지 않음 → 차단
- 자동 입력 변수의 소스 데이터 누락 → 경고
- 유효성 규칙 위반 → 경고
임시저장은 항상 허용.

---

### 변경/생성 파일

**신규**
- `src/lib/smartVariables.ts` — 시스템 변수 카탈로그, 타입, 해석/검증 함수
- `src/components/documents/SmartVariableConfig.tsx` — Step 2 UI
- `src/components/documents/SmartVariablePanel.tsx` — 에디터 사이드 패널 (카테고리/검색/삽입)
- `src/components/documents/TemplatePreview.tsx` — Step 4 미리보기
- `src/components/documents/WizardStepper.tsx` — 단계 인디케이터
- `src/hooks/useTemplateVersions.ts`

**수정**
- `src/pages/DocumentBuilder.tsx` — 5단계 위저드로 재작성
- `src/pages/Documents.tsx` — 카드 액션 추가 (복제/새 버전/비활성화)
- `src/hooks/useDocuments.ts` — 버전 인지 저장/전송 로직, 스냅샷
- `src/lib/documentTypes.ts` — 새 변수/버전 타입 추가
- 마이그레이션 SQL

---

### 진행 방식

1. DB 마이그레이션 먼저 실행 (승인 필요)
2. 승인 후 코드 구현 일괄 진행
3. 기존 템플릿/요청은 자동으로 v1로 마이그레이션 (data backfill 포함)

진행해도 될까요?
