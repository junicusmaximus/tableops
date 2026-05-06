## TableOps 채팅 시스템 — 모던 실시간 메신저 리뉴얼

### 목표
현재의 기본적인 채팅 UI를 KakaoTalk/Slack/Jandi/Shapl 수준의 실무용 매장 메신저로 리뉴얼합니다. 단순 시각 변경이 아니라 데이터 모델, 실시간 동기화, 권한, 운영용 카드 메시지까지 포함합니다.

규모가 큰 작업이므로 **3단계로 나눠 PR을 분리 진행**하겠습니다. 이 플랜은 전체 그림을 보여주고, 승인 시 Phase 1부터 바로 구현합니다.

---

### 현재 상태 (조사 결과)
- 테이블: `chat_rooms`, `chat_room_members`, `chat_messages`, `chat_mentions`, `chat_read_receipts` 존재
- 미존재: `chat_attachments`(별도 테이블 없음 — 메시지 컬럼에 file_url), `chat_reactions`, `chat_pinned_messages`(rooms.pinned_message_id로 1개만), `chat_confirmations`, 메시지 `parent_message_id`/`deleted_at`/`metadata`
- UI: `Chat.tsx` + `ChatSidebar/ChatMessageArea/ChatWorkspace` 존재. 멘션/파일/고정/읽음 일부 구현
- Realtime publication 미확인 — 메시지 구독 동작 점검 필요

---

### Phase 1 — 데이터 모델 & 실시간 기반 (이번 PR)

**DB 마이그레이션**
- `chat_messages`에 `metadata jsonb`, `parent_message_id uuid`, `deleted_at timestamptz`, `updated_at` 추가
- 신규 테이블:
  - `chat_reactions(message_id, user_id, reaction_type)` + RLS(룸 멤버만)
  - `chat_confirmations(message_id, user_id, confirmed_at)` + RLS
  - `chat_pinned_messages(room_id, message_id, pinned_by, pinned_at)` — 다중 고정 지원
- `chat_room_members`에 `muted bool default false`, `last_read_at timestamptz`, `is_pinned bool`, `role_in_room text`, `notification_enabled bool` 추가
- `chat_rooms`에 `branch_id`(brand_id 매핑), `is_default bool`, `is_announcement bool`, `description text` 추가
- 기본 룸 자동 생성 함수 `ensure_default_chat_rooms(_store_id)` — 매장 단위 (전체/홀팀/주방팀/매니저/공지) 5개 생성 + 직급별 자동 가입
- `handle_new_user`/`link_pending_employee`에서 `ensure_default_chat_rooms` 호출
- Realtime publication에 채팅 테이블 등록 (`ALTER PUBLICATION supabase_realtime ADD TABLE ...`)

**프론트 기반**
- `useChat` 훅 정리: `useChatRooms`, `useChatMessages`, 신규 `useReactions`, `useConfirmations`, `usePinnedMessages`, `useTypingIndicator`(presence)
- 실시간 구독 훅 통합 (`useChatRealtime(roomId)`)

---

### Phase 2 — 모던 UI 리뉴얼 (다음 PR)

- 데스크탑: 3컬럼 (카테고리 사이드바 / 룸 리스트 / 대화창) — 좌측 카테고리에 채널/팀/공지/DM/업무 분류
- 모바일: 룸 리스트 ↔ 대화창 슬라이드 전환, 하단 고정 입력바
- 메시지 그룹핑 (같은 사람 연속 메시지 묶기), 날짜 디바이더 (오늘/어제/YYYY년 M월 D일)
- 카카오 스타일 버블, 본인은 우측 정렬 + primary 색상
- 읽음 표시 ("읽음 N" / 안읽음 카운트), 룸 리스트 unread 배지
- 프로필 카드 팝오버 (이미지/이름/직급/매장/근무상태/1:1 채팅 버튼)
- 근무 상태 dot (출근/자리비움/휴가/오프라인) — `attendance_logs`와 `employee_profiles.status` 연동
- 채팅방 만들기 다이얼로그 강화 (유형/매장/직급/멤버 선택)
- 검색: 룸/메시지/직원/파일 통합 검색

---

### Phase 3 — 운영용 카드 & 부가기능 (다음 PR)

- 메시지 반응 (확인/좋아요/완료/긴급/이모지) UI
- "확인 요청" 메시지 카드 + 확인자 리스트
- 운영 카드 메시지 (`message_type`+`metadata`로 렌더):
  - 스케줄 변경 / 교대 요청 / 휴가 결재 / 체크리스트 완료 / 재고 부족 / 발주 / 전자문서 서명 / 공지
- 다중 고정 메시지 영역
- 멘션 알림 (notifications 테이블 연동)
- 알림 설정 패널 (채팅/멘션/공지/DM 토글)
- 타이핑 인디케이터 (Supabase Realtime presence)
- 파일/이미지 메시지 카드 (썸네일, 사이즈, 다운로드, 라이트박스)
- RBAC 강화: `usePermissions`로 룸 생성/고정/공지 게시 권한 게이트

---

### 권한 매트릭스 (요약)
- **대표/사장님**: 전체 룸 관리, 회사 공지 채널 관리
- **매니저**: 본인 매장 룸 관리, 공지 고정, 룸 생성
- **정직원/파트타이머**: 가입된 룸만 보기/메시지, 룸 관리 불가
- 권한 없는 룸은 UI에 노출 안 됨, URL 직접 접근도 RLS로 차단

---

### 기술 메모
- Supabase Realtime: postgres_changes + presence(타이핑/접속) 사용
- 운영 카드는 단일 `chat_messages` 행으로 저장하고 `message_type='card'` + `metadata.cardType`으로 분기 렌더 → 신규 테이블 불필요
- 첨부는 기존 `file_url/file_name/file_type` 유지하되 다중 첨부가 필요하면 Phase 3에서 `chat_attachments` 도입
- 파일은 기존 `chat_files` 버킷 사용
- 모든 신규 테이블은 RLS 필수, `is_store_member` + 룸 멤버십 기반

---

### 이번 PR(Phase 1)에서 변경되는 파일
- 마이그레이션 1개 (스키마 + 기본 룸 함수 + realtime publication)
- `src/hooks/useChat.ts` 확장
- 신규: `src/hooks/useChatRealtime.ts`, `src/hooks/useChatReactions.ts`, `src/hooks/useChatConfirmations.ts`
- 기존 UI는 Phase 2에서 본격 교체

승인해 주시면 Phase 1 마이그레이션부터 시작하겠습니다. (마이그레이션은 별도 승인 단계가 한 번 더 있습니다.)
