# 교육/매뉴얼/레시피 지식센터 구현 계획

TableOps에 직원 교육·업무 매뉴얼·레시피북·퀴즈·이수 현황을 통합한 **지식관리센터**를 구축합니다. 단순 문서 목록이 아닌, 권한 기반 학습 플랫폼입니다.

---

## 1. 데이터베이스 (마이그레이션 1건)

### 신규 테이블
- **knowledge_articles** — 업무 매뉴얼
  - `title, category, content(jsonb 단계별), summary, target_roles(text[]), store_id, organization_id, importance(low/normal/high/critical), status(draft/published/archived), version, attachments(jsonb), require_acknowledgement(bool), created_by`
- **recipe_books** — 레시피 헤더
  - `title, english_name, category, description, serving_size, batch_size, prep_method, cook_time, storage_method, expiry_rule, plating_guide, allergy_info(text[]), warnings, photo_url, video_url, cost_info(jsonb 매니저+only), visibility_scope(all/full_time/manager_only), status, version, store_id, organization_id`
- **recipe_ingredients** — 레시피 재료 (recipe_id FK 논리 참조)
  - `recipe_id, ingredient_id nullable, ingredient_name, quantity, unit, memo, sort_order`
- **recipe_versions** — 레시피 버전 스냅샷
  - `recipe_id, version_number, snapshot(jsonb 전체 헤더+재료+조리순서), change_log, created_by`
- **training_courses** — 교육 코스
  - `title, description, training_type, target_roles(text[]), store_id, required(bool), due_days(int), estimated_minutes, status, created_by`
- **training_course_items** — 코스 구성요소
  - `course_id, item_type(manual/recipe/quiz), item_id, sort_order`
- **training_assignments** — 직원별 배정
  - `course_id, assigned_to_user_id, assigned_by, status(not_started/in_progress/completed/overdue), due_date, started_at, completed_at, quiz_score, acknowledged_at`
- **quiz_questions** — 퀴즈 문항
  - `course_id, question_type(multiple_choice/ox/short_answer/checklist), question, options(jsonb), correct_answer(jsonb), explanation, points, sort_order, pass_threshold`
- **quiz_attempts** — 응시 기록
  - `course_id, user_id, answers(jsonb), score, passed(bool), submitted_at, allow_retry(bool)`
- **manual_acknowledgements** — 매뉴얼 확인 서명
  - `article_id, article_version, user_id, acknowledged_at, ip_address, user_agent, signature_method(click/typed/drawn), signature_data`

### RLS 핵심 패턴
- `SELECT`: `is_store_member(auth.uid(), store_id)` AND (대상 직급 매칭 OR 매니저 이상)
- `INSERT/UPDATE/DELETE`: `has_role_or_higher(auth.uid(), 'manager')` AND 매장 멤버
- 레시피 cost_info / visibility_scope='manager_only' 필드는 클라이언트에서 매니저 이상에게만 표시
- `manual_acknowledgements`, `quiz_attempts`, `training_assignments`: 본인 또는 매니저만 SELECT

### 트리거
- 레시피 publish 시 `recipe_versions` 자동 스냅샷
- 매뉴얼 publish 시 version +1
- assignment due_date 경과 시 `overdue` 처리는 클라이언트 도출

---

## 2. 프론트엔드 구조

### 신규 페이지
- **/knowledge** — 지식센터 메인 (5개 탭)
  - `tabs: 업무 매뉴얼 / 레시피북 / 교육 자료 / 테스트/퀴즈 / 이수 현황`
- **/knowledge/articles/new**, **/knowledge/articles/:id**, **/knowledge/articles/:id/edit** — 매뉴얼 작성/조회/편집
- **/knowledge/recipes/new**, **/knowledge/recipes/:id**, **/knowledge/recipes/:id/edit** — 레시피 작성/조회/편집 (재료 테이블, 버전 히스토리)
- **/knowledge/courses/new**, **/knowledge/courses/:id** — 교육 코스 빌더 + 배정 모달
- **/knowledge/quizzes/:courseId/take** — 직원 퀴즈 응시 화면
- **/knowledge/my-progress** — 직원 학습 대시보드

### 신규 훅
- `useKnowledgeArticles` — CRUD + 필터/검색
- `useRecipes`, `useRecipeVersions`, `useRecipeIngredients`
- `useTrainingCourses`, `useTrainingAssignments`, `useMyAssignments`
- `useQuizQuestions`, `useQuizAttempts`
- `useManualAcknowledgements`
- `useKnowledgePermissions` — 역할별 가시성 helper

### 신규 컴포넌트
- `ArticleEditor` — 단계별 절차 + 첨부 + 카테고리/대상 직급 선택
- `RecipeEditor` — 재료 동적 테이블 + 알레르기 multi-select + 가시성 토글
- `RecipeIngredientsTable` — quantity/unit/memo
- `RecipeVersionHistory` — diff 패널
- `CourseBuilder` — 매뉴얼/레시피/퀴즈 드래그 추가
- `QuizPlayer` — 4가지 문항 타입 렌더 + 채점
- `AssignmentDialog` — 대상 직원/직급/매장 + 기한 + 필수
- `AcknowledgementButton` — "확인했습니다" 클릭 → manual_acknowledgements insert
- `ProgressMatrix` — 매니저용 직원 × 코스 행렬
- `KnowledgeSearchBar` — 통합 검색

---

## 3. 사이드바 / 라우팅
- `DesktopSidebar.tsx`: 기존 `/glossary` (용어/매뉴얼) 항목을 **`/knowledge` "교육/매뉴얼"** 로 대체. (Glossary 페이지는 라우트 유지하되 메뉴에서는 제거)
- `MobileBottomNav` 영향 없음 (More 메뉴에 추가)
- `App.tsx`: 신규 라우트 9개 추가

---

## 4. 권한 매트릭스

```text
                매뉴얼   레시피(전체)  레시피(원가)  코스생성  배정  진행조회  퀴즈응시
ceo / owner       CRUD       CRUD          ✓          ✓       ✓     전체       -
boss              CRUD       CRUD          ✓          ✓       ✓     매장       -
manager           CRUD*      CRUD*         ✓          ✓       ✓     매장       -
full_time         R(대상)    R(공개분)     ✗          ✗       ✗     본인       ✓
part_time         R(대상)    R(공개분)     ✗          ✗       ✗     본인       ✓
```
\* manager는 자기 매장 범위 내에서만

---

## 5. 검색
클라이언트 ilike 기반 통합 검색:
- `knowledge_articles.title, content`
- `recipe_books.title, english_name, description`
- `recipe_ingredients.ingredient_name`
- 필터: 카테고리 / 대상 직급 / 상태 / 필수 여부 / 완료 여부

---

## 6. 알림 (선택적/스텁)
기존 `notification_preferences`에 `enable_training`, `enable_recipe_update` 컬럼 추가. UI 토글만 노출 (실제 푸시는 향후 확장).

---

## 7. 대시보드 위젯
`Dashboard.tsx`에 카드 추가:
- 매니저: 필수 교육 이수율 / 미완료 직원 수 / 최근 매뉴얼 / 최근 레시피
- 직원: 오늘 학습할 자료 / 미완료 교육 / 기한 임박

---

## 8. AI 매뉴얼 검색 (Phase 1 스텁)
`/knowledge` 상단에 검색바 + "AI에게 물어보기" 버튼 → 첫 단계는 키워드 기반 매뉴얼/레시피 매칭으로 출처 카드 노출. 등록된 자료에서 매칭이 없으면 안내 메시지만 표시. (Edge function 본격 구현은 Phase 2로 분리, 본 작업에선 클라이언트 매칭만)

---

## 9. 작업 순서
1. DB 마이그레이션 (10개 테이블 + RLS + version 트리거)
2. 권한 훅 + 데이터 훅 일괄 구현
3. 매뉴얼 CRUD UI + 확인서명
4. 레시피 CRUD UI + 재료 테이블 + 버전 히스토리
5. 교육 코스 빌더 + 배정 + 퀴즈 작성
6. 직원 학습 화면 + 퀴즈 응시 + 진행률
7. 통합 검색 + 매니저 진행 매트릭스
8. 사이드바/라우팅/대시보드 위젯 연결
