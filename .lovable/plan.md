# 매출 분석 시스템 구현 계획

기존 `daily_sales` 위주의 단순 구조를 본격적인 **매출 분석 플랫폼**으로 확장합니다. 데이터 모델, 권한, 대시보드, 임포트, 감사 로그를 모두 실제 데이터 기반으로 구축합니다.

---

## 1. 데이터베이스 스키마 (마이그레이션 1건)

### 1-1. `sales_records` (거래 단위 상세 매출)
- `store_id`, `organization_id`, `business_date`, `sales_datetime`, `sales_hour`(int 0-23), `weekday`(int 0-6)
- `transaction_id`, `order_id`, `approval_time`
- `payment_method` (card/cash/delivery/other), `sales_channel` (dine_in/delivery/takeout/reservation/etc)
- 금액: `gross_sales`, `discount_amount`, `refund_amount`, `net_sales`, `vat_amount`, `card_sales`, `cash_sales`, `delivery_sales`, `alcohol_sales`
- `source_type` (manual/csv_import/pos_api/van_api/nice_van/reservation_api), `raw_source_name`, `memo`, `created_by`
- 인덱스: (store_id, business_date), (store_id, sales_datetime)
- 트리거: `sales_hour`, `weekday` 자동 채움

### 1-2. `company_settings` (대표 전용 권한 설정)
- `organization_id` UNIQUE
- `allow_manager_sales_access` bool default true
- `allow_manager_sales_detail_access` bool default false
- `allow_manager_branch_comparison` bool default false
- `updated_by`, `updated_at`

### 1-3. `sales_audit_logs`
- `user_id`, `user_role`, `action_type` (sales_viewed/sales_imported/sales_record_updated/manager_sales_access_changed)
- `store_id`, `target_period`, `metadata` jsonb

### 1-4. `sales_import_batches`
- `store_id`, `uploaded_by`, `file_name`, `row_count`, `imported_count`, `duplicate_count`, `status`

### 1-5. RLS 및 보안 함수
- `can_view_sales(_user_id, _store_id)` SECURITY DEFINER 함수
  - `ceo`, `owner` → 항상 true (조직 범위 내)
  - `manager` → `company_settings.allow_manager_sales_access = true`이고 매장 멤버일 때만
  - 그 외 → false
- `can_manage_sales_settings(_user_id, _org_id)` → `ceo`만 true
- 모든 매출 테이블 RLS는 위 함수로 제어
- audit log RLS: 조회는 `ceo/owner`만, insert는 본인만

---

## 2. 백엔드 / 훅

- `src/lib/salesPermissions.ts` — 클라 측 권한 helper (read query로 settings + role 조합)
- `src/hooks/useSalesPermissions.ts` — `{ canView, canManageSettings, canViewBranchComparison, blockedReason }`
- `src/hooks/useSalesRecords.ts` — 기간/필터 기반 조회, 집계
- `src/hooks/useCompanySettings.ts` — 대표 권한 설정 CRUD
- `src/hooks/useSalesImport.ts` — CSV 파싱(papaparse)/Excel(xlsx) → 컬럼 매핑 → 중복 검사 → 일괄 insert
- `src/lib/salesAnalytics.ts` — 순수 함수 집계 (시간대/요일/전년동월/인사이트 문장 생성)

---

## 3. UI 페이지/컴포넌트

### 3-1. `/sales` (기존 페이지 전면 개편)
권한 차단 시: `EmptyState` + 메시지 "대표자 권한 설정에 의해 매출 분석 접근이 제한되었습니다."

데이터 없음: 안내 + CTA(직접 입력/CSV 업로드/연동 설정).

레이아웃:
- **Filter Bar**: 매장(권한 범위), 기간(오늘/이번주/이번달/지난달/올해/사용자지정), 결제수단, 판매채널
- **KPI Cards (7개)**: 오늘/이번달 누적/전년 동일월/증감률/평균 일매출/최고 요일/최고 시간대
- **Trend Chart**: 일/주/월 토글 LineChart (recharts)
- **YoY Comparison**: BarChart + 증감률 배지
- **Hourly BarChart** + 인사이트 문구
- **Weekday BarChart** + 평일/주말 비교 인사이트
- **Branch Comparison**: 다지점 + 권한 있을 때만
- **Insights Panel**: 실데이터 기반 동적 문장 5개

### 3-2. `/sales/entry` — 매출 직접 입력 폼
### 3-3. `/sales/import` — CSV/Excel 업로드 위저드 (5단계)
1) 업로드 → 2) 미리보기 → 3) 컬럼 매핑 → 4) 검증/중복 경고 → 5) 확정

### 3-4. `/settings/sales-access` — 대표 전용 설정 페이지
3개의 ON/OFF 토글, 변경 시 audit log 기록.

### 3-5. Settings 페이지 카드 추가
대표만 보이는 "매출 데이터 접근 권한" 카드.

---

## 4. 라우팅 (`App.tsx`)
- `/sales` (개편), `/sales/entry`, `/sales/import`, `/settings/sales-access`
- 라우트 가드: `useSalesPermissions().canView` false면 차단 페이지 렌더

---

## 5. AI 리포트 연동
`supabase/functions/ai-store-report/index.ts` 입력 컨텍스트에 다음 추가:
- 월별 매출 추이, 전년 동월 비교, 시간대 패턴, 요일 패턴, 지점 비교
- 프롬프트에 한국어 인사이트 가이드 주입

---

## 6. 감사 로그 적용 시점
- 매출 분석 페이지 첫 진입 시 `sales_viewed` (디바운스: 동일 사용자/매장 1시간 1회)
- CSV 임포트 완료: `sales_imported` (행 수 metadata)
- 매출 레코드 수정: `sales_record_updated`
- 대표 설정 토글: `manager_sales_access_changed` (이전/이후 값)

---

## 7. 기술 디테일

```text
권한 결정 흐름
 ┌──────────────┐
 │ user role?   │
 └──┬───────────┘
    │ ceo / owner ──► canView = true
    │ manager     ──► company_settings.allow_manager_sales_access?
    │                  └─ true  ► canView = true (assigned store만)
    │                  └─ false ► canView = false (차단 메시지)
    │ full_time / part_time ──► canView = false
```

- 차트: 기존 `recharts` 활용
- CSV: `papaparse` (이미 설치됨), Excel: `xlsx` (이미 설치됨)
- 모든 텍스트 한국어
- 다크 테마/세만틱 토큰 준수

---

## 8. 작업 순서 (Task 트래킹)
1. DB 마이그레이션 (스키마 + RLS + helper functions)
2. 권한 훅 + lib
3. CompanySettings 페이지 + 라우트
4. SalesRecords 훅 + analytics lib
5. Sales 대시보드 개편
6. 매출 입력 페이지
7. CSV 임포트 위저드
8. Settings 카드/네비 진입점
9. AI 리포트 함수 컨텍스트 확장
10. 감사 로그 훅 연동
