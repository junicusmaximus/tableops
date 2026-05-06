# Role-based UI Visibility System

A single source of truth for "who can see/do what", wired into sidebar, route guards, dashboard cards, page tabs, action buttons, and key data queries. Hidden everywhere — never shown as disabled.

## Phase 1 — Foundation (this turn)

### 1.1 Centralized permission module — `src/lib/permissions.ts`
- Internal role keys reuse the existing `AppRole`: `ceo`, `owner`, `boss`, `manager`, `full_time`, `part_time`, plus `kitchen_staff`/`hall_staff` mapped to staff group.
- `Permission` string union of all keys from spec §5 (employee_management.*, schedule.*, attendance.*, leave.*, sales.*, inventory.*, purchase_orders.*, documents.*, electronic_documents.*, training.*, ai_reports.*, settings.*, chat.*).
- Role → permission set matrix (literal, easy to audit & test).
- 대표-toggle gating layered on top via a `CompanySettings` arg with the existing flags + new ones (`allow_manager_ai_report_access`, `allow_manager_document_management`, `allow_manager_recipe_cost_view`, `allow_manager_integration_access`).
- Helpers: `can(role, perm, settings?)`, `canAny`, `canAll`, `canAccessRoute(role, path, settings?)`, `canViewMenu(role, menuKey, settings?)`.
- Pure functions only — no React/Supabase imports → trivially unit-testable.

### 1.2 React hooks — `src/hooks/usePermissions.ts`
- `useCompanySettings()` — fetches `company_settings` for the current org (cached via react-query).
- `usePermissions()` returns `{ role, can, canAny, canAccessRoute, canViewMenu, isLoading }` bound to the current user + their org settings (and `useRoleOverride` for the dev switcher).
- `<Can perm="…">{…}</Can>` render-prop component: renders nothing if disallowed.

### 1.3 Route guard — `src/components/auth/RoleGuard.tsx`
- Wraps `<Outlet />` (or children).
- If unauthenticated → existing flow.
- If route not allowed for role → render `<NoAccess />` with the spec messages:
  - default: "접근 권한이 없습니다."
  - 대표-toggle blocked: "대표자 권한 설정에 의해 접근이 제한되었습니다."
- Wire into `App.tsx` for the manager-only routes already enumerated (`/staff`, `/staff/:id`, `/schedule-management`, `/ai-schedule`, `/ai-report`, `/sales`, `/ingredients`, `/purchase-orders`, `/settings/access-integration`).

### 1.4 Tests — `src/test/permissions.test.ts`
- Snapshot per role of: full permission set, visible top-level menu keys, accessible routes.
- Toggle scenarios: manager + sales toggle off, manager + ai report toggle off, etc.

### 1.5 Sidebar + MoreMenu rewrite to consume `canViewMenu`
- Replace ad-hoc `managerOnly` flag with menu-key driven filtering.
- Same data drives Desktop sidebar and mobile MoreMenu.

## Phase 2 — Wire foundational surfaces (this turn if size allows, otherwise next turn)

- Dashboard cards (`src/pages/Index.tsx` / dashboard components) → wrap each card in `<Can>` with the appropriate perm.
- Settings page tabs → drive tab list from `canViewMenu('settings.<tab>')`.
- Document, Training, Schedule pages → drive tab + primary action button visibility from perms.
- Update existing per-page button checks (`isManager`, `useSalesPermissions`, etc.) to delegate to `usePermissions().can(...)` so the matrix is the only source.

## Phase 3 — Manager-toggle settings (next turn, after Phase 1 lands)

- Migration: add columns `allow_manager_ai_report_access`, `allow_manager_document_management`, `allow_manager_recipe_cost_view`, `allow_manager_integration_access` to `company_settings` (default `true` to preserve current behavior).
- 대표-only toggles UI in `Settings → 권한 설정`.
- Permission matrix already reads them in Phase 1.

## Phase 4 — Search + audit log (next turn)

- Global menu search filters via `canViewMenu`.
- Lightweight `access_denied_logs` table + RLS, called from `RoleGuard` for sensitive routes.

## Out of scope for this turn

- Per-row table action visibility on every existing list (will be migrated incrementally as each page is touched).
- Realtime/data-query hardening beyond what existing RLS already enforces — current RLS policies already cover the data side; UI hiding is the new layer.

## Technical details

- Role group helpers live next to `AppRole` in `src/hooks/useUserRole.ts`; no breaking changes to existing imports.
- Existing `useIsManager` / `useIsStaff` keep working but become thin wrappers around `usePermissions`.
- All permission strings are typed; misuse is a TS error.
- Snapshot test covers ceo/owner/boss/manager/full_time/part_time/hall_staff/kitchen_staff × default settings + manager-toggle-off variants.

```text
permissions.ts (pure)
        │
        ├── usePermissions() ── React/Supabase
        │           │
        │           ├── DesktopSidebar / MoreMenu
        │           ├── <Can perm="…">  (buttons, cards, tabs)
        │           └── RoleGuard (route-level)
        │
        └── permissions.test.ts (snapshots per role)
```

Confirm and I'll implement Phase 1 + Phase 2 in the next turn (single PR, ~8–12 files).