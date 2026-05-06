## 전자문서 시스템 구축 계획

기존 "서류 관리" 모듈을 실제 전자문서 작성·서명·보관 워크플로우로 전면 교체합니다. 모바일 서명까지 지원하는 SaaS 수준의 e-문서 시스템을 만듭니다.

---

### 1단계: 데이터베이스 스키마 (Supabase 마이그레이션)

새 테이블 7종을 생성하고 RLS 정책을 적용합니다.

- **document_templates** — 템플릿 (제목, 카테고리, 설명, schema(JSONB), status, created_by, store_id)
- **document_fields** — 템플릿의 필드 정의 (type, label, placeholder, required, position, options, validation)
- **document_requests** — 발송된 문서 인스턴스 (template_id, sender, recipient, store_id, status, due_date, sent_at, viewed_at, completed_at)
- **document_field_values** — 직원이 입력한 값 (request_id, field_id, value, filled_by, filled_at)
- **document_signatures** — 서명 정보 (signer, method, signature_image, typed_name, consent_*, ip, user_agent, document_version_hash)
- **document_audit_logs** — 모든 이벤트 (event_type, actor, ip, user_agent, metadata)
- **final_documents** — 잠긴 최종본 (final_html, final_pdf_url, document_hash)

추가:
- `signatures` 스토리지 버킷 (private)
- 역할별 RLS: 관리자(ceo/owner/boss/manager)는 매장 문서 전체 CRUD, 직원은 자신에게 할당된 문서만 조회·서명
- 알림 트리거: 문서 발송/서명 완료 시 `notifications` insert

---

### 2단계: 페이지 / 라우트 구조

기존 `Documents.tsx`를 e-문서 허브로 교체하고 하위 라우트를 추가합니다.

```
/documents                    → 허브 (탭 기반)
  ├ 탭: 받은 문서 (직원/매니저)
  ├ 탭: 보낸 문서 (매니저)
  ├ 탭: 템플릿 (매니저)
  └ 탭: 보관함 (완료된 문서)

/documents/templates/new      → 템플릿 빌더
/documents/templates/:id      → 템플릿 편집
/documents/send/:templateId   → 발송 (수신자 선택 + 미리보기)
/documents/sign/:requestId    → 직원 서명 페이지 (모바일 우선)
/documents/view/:requestId    → 문서 상세 + 감사이력
```

---

### 3단계: 템플릿 빌더 (`DocumentBuilder.tsx`)

3컬럼 레이아웃:

```text
┌──────────┬─────────────────────┬──────────┐
│ 필드툴   │   문서 캔버스       │ 필드설정 │
│ 텍스트   │   드래그/배치       │ label    │
│ 입력     │   스마트변수 토큰   │ required │
│ 날짜     │   {{직원명}} 등     │ 수신자   │
│ 체크박스 │                     │ 검증     │
│ 서명     │                     │          │
│ ...      │                     │          │
└──────────┴─────────────────────┴──────────┘
```

- 필드 종류: 텍스트/제목/설명/입력/날짜/체크박스/드롭다운/서명/구분선/표
- 스마트 변수: `{{회사명}}`, `{{매장명}}`, `{{직원명}}`, `{{시급}}`, `{{입사일}}` 등 — 발송 시 직원 프로필에서 자동 치환
- 저장 시 `template_schema`(JSONB)에 필드 배열 직렬화
- 사전 시드 템플릿: **근로계약서**, **개인정보·전자서명 동의서**, **보건증 제출 확인서**

---

### 4단계: 발송 플로우 (`DocumentSend.tsx`)

1. 템플릿 선택
2. 수신자(직원) 선택 (employee_profiles 검색)
3. 마감일 설정
4. 자동입력 미리보기 — 누락 데이터는 경고 표시
5. 발송 → `document_requests` insert + `notifications` insert + 감사로그

---

### 5단계: 직원 서명 페이지 (`DocumentSign.tsx`, 모바일 우선)

- 상단: 문서 제목, 요청자, 마감일, 진행률
- 본문: 캔버스 렌더링 (자동입력 + 입력 필드)
- 서명 영역: **canvas signature pad** (마우스/터치) + **이름 입력 서명** 토글
- 동의 체크박스 + 지정된 동의문 표시
- 제출 시:
  - 모든 필수필드/동의 검증
  - `document_field_values` 저장
  - 서명 이미지 → `signatures` 버킷 업로드
  - `document_signatures` insert (consent text/timestamp/ua/version hash)
  - `final_documents` 생성 (렌더링된 HTML + SHA-256 hash)
  - `document_requests.status = 'completed'`
  - 매니저에게 알림

---

### 6단계: 상태/감사이력/문서 상세

- 상태 9종: 임시저장/전송 대기/서명 요청됨/열람 완료/작성 중/서명 완료/반려/만료/취소됨
- `StatusBadge`로 색상 구분
- 모든 액션은 `useAuditLog` 훅에서 `document_audit_logs` insert
- 상세 페이지: 미리보기 + 입력값 + 서명 + 동의 정보 + 감사 타임라인 + (매니저) 재전송/취소 버튼

---

### 7단계: 컴포넌트 구조

```
src/pages/Documents.tsx                       (허브, 탭)
src/pages/DocumentBuilder.tsx                 (템플릿 빌더)
src/pages/DocumentSend.tsx                    (발송)
src/pages/DocumentSign.tsx                    (직원 서명)
src/pages/DocumentDetail.tsx                  (상세 + 감사이력)

src/components/documents/
  ├ TemplateCard.tsx
  ├ DocumentList.tsx
  ├ FieldPalette.tsx
  ├ DocumentCanvas.tsx
  ├ FieldSettings.tsx
  ├ SignaturePad.tsx          (canvas + 이름입력)
  ├ ConsentBlock.tsx
  ├ AuditTimeline.tsx
  ├ SmartVariableToken.tsx
  └ DocumentStatusBadge.tsx

src/hooks/
  ├ useDocumentTemplates.ts
  ├ useDocumentRequests.ts
  ├ useDocumentSign.ts
  └ useAuditLog.ts
```

---

### 8단계: 검증 및 보안

- Zod 스키마로 모든 입력 검증
- RLS로 직원이 다른 직원의 문서를 절대 조회 불가
- 최종 문서 잠금: `final_documents`에 UPDATE 정책 없음 (insert만 허용)
- 서명 이미지 버킷은 private + RLS

---

### 기술 노트

- PDF 생성은 1차로 보류, `final_html` + 추후 PDF 자리표시자(`final_pdf_url nullable`) 유지
- 서명 캔버스는 react-signature-canvas 의존성 추가 (또는 native canvas 직접 구현 — 의존성 최소화 위해 native)
- 모바일 터치 이벤트 처리 필수
- 다크 테마 디자인 토큰 준수 (amber primary, navy bg)
- 모든 라벨/메시지 한국어

---

### 작업 순서

1. DB 마이그레이션 + 스토리지 버킷 + 시드 템플릿
2. 훅 (templates/requests/sign/audit)
3. 허브 페이지 + 라우트 추가
4. 템플릿 빌더
5. 발송 플로우
6. 서명 페이지 + 캔버스
7. 상세 페이지 + 감사이력
8. 알림 연동 + 최종 검증

규모가 큰 작업이라 여러 단계로 나눠 점진적으로 구현하며, 각 단계가 독립적으로 동작하도록 만들겠습니다.