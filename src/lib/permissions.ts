/**
 * Centralized role-based permission system.
 *
 * Pure module — no React, no Supabase imports — so it can be unit-tested
 * trivially and reused from any layer (UI, route guards, data hooks).
 *
 * Single source of truth used by:
 *   - usePermissions() hook + <Can> component
 *   - RoleGuard route guard
 *   - DesktopSidebar / MobileBottomNav / MoreMenu menu filters
 */

import type { AppRole } from '@/hooks/useUserRole';

// ============================================================================
// Roles
// ============================================================================

/** Roles considered "manager-tier" (can administer the store). */
export const MANAGER_ROLES: AppRole[] = ['ceo', 'owner', 'boss', 'manager'];

/** Roles considered "staff-tier" (rank-and-file workers). */
export const STAFF_ROLES: AppRole[] = ['full_time', 'part_time', 'kitchen_staff', 'hall_staff'];

export const isManager = (role: AppRole | null | undefined): boolean =>
  !!role && MANAGER_ROLES.includes(role);

// ============================================================================
// Permission keys (typed string union — misuse is a TS error)
// ============================================================================

export type Permission =
  // Employee management
  | 'employee_management.view'
  | 'employee_management.create'
  | 'employee_management.edit'
  | 'employee_management.delete'
  // Schedule
  | 'schedule.view_own'
  | 'schedule.manage'
  | 'schedule.create'
  | 'schedule.edit'
  | 'schedule.delete'
  | 'schedule.ai_recommend'
  // Attendance
  | 'attendance.view_own'
  | 'attendance.view_branch'
  | 'attendance.edit'
  // Leave
  | 'leave.request'
  | 'leave.approve'
  | 'leave.reject'
  | 'leave.view_all'
  // Sales
  | 'sales.view_summary'
  | 'sales.view_detail'
  | 'sales.import'
  | 'sales.analytics'
  | 'sales.permission_settings'
  // Inventory
  | 'inventory.view'
  | 'inventory.manage'
  | 'inventory.create'
  | 'inventory.edit'
  | 'inventory.delete'
  // Purchase orders
  | 'purchase_orders.view'
  | 'purchase_orders.create'
  | 'purchase_orders.approve'
  | 'purchase_orders.reject'
  // Documents (general)
  | 'documents.view_own'
  | 'documents.manage'
  | 'documents.send_for_signature'
  | 'documents.sign'
  | 'documents.view_audit'
  // Electronic documents (templates)
  | 'electronic_documents.create_template'
  | 'electronic_documents.edit_template'
  | 'electronic_documents.send'
  | 'electronic_documents.sign'
  | 'electronic_documents.view_completed'
  // Training / knowledge
  | 'training.view_assigned'
  | 'training.manage'
  | 'training.assign'
  | 'training.view_progress'
  | 'training.edit_content'
  | 'training.view_recipe_cost'
  // AI reports
  | 'ai_reports.view'
  | 'ai_reports.generate'
  // Settings
  | 'settings.view_profile'
  | 'settings.manage_company'
  | 'settings.manage_integrations'
  | 'settings.manage_permissions'
  // Chat
  | 'chat.view'
  | 'chat.create_room'
  | 'chat.manage_room'
  | 'chat.pin_message'
  | 'chat.mention';

// ============================================================================
// Company settings (대표 toggles)
// ============================================================================

/**
 * Company-level toggles controlled by 대표 that can withhold permissions
 * from 매니저. Defaults all `true` to preserve existing behavior.
 *
 * Phase 3 will persist `allow_manager_ai_report_access`,
 * `allow_manager_document_management`, `allow_manager_recipe_cost_view`,
 * and `allow_manager_integration_access` to the `company_settings` table.
 */
export interface CompanySettings {
  allow_manager_sales_access: boolean;
  allow_manager_sales_detail_access: boolean;
  allow_manager_branch_comparison: boolean;
  allow_manager_ai_report_access: boolean;
  allow_manager_document_management: boolean;
  allow_manager_recipe_cost_view: boolean;
  allow_manager_integration_access: boolean;
}

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  allow_manager_sales_access: true,
  allow_manager_sales_detail_access: false,
  allow_manager_branch_comparison: false,
  allow_manager_ai_report_access: true,
  allow_manager_document_management: true,
  allow_manager_recipe_cost_view: true,
  allow_manager_integration_access: true,
};

// ============================================================================
// Role → permission matrix
// ============================================================================

const CEO_PERMISSIONS: Permission[] = [
  // Everything. Listed explicitly so adding a new permission forces a review.
  'employee_management.view', 'employee_management.create', 'employee_management.edit', 'employee_management.delete',
  'schedule.view_own', 'schedule.manage', 'schedule.create', 'schedule.edit', 'schedule.delete', 'schedule.ai_recommend',
  'attendance.view_own', 'attendance.view_branch', 'attendance.edit',
  'leave.request', 'leave.approve', 'leave.reject', 'leave.view_all',
  'sales.view_summary', 'sales.view_detail', 'sales.import', 'sales.analytics', 'sales.permission_settings',
  'inventory.view', 'inventory.manage', 'inventory.create', 'inventory.edit', 'inventory.delete',
  'purchase_orders.view', 'purchase_orders.create', 'purchase_orders.approve', 'purchase_orders.reject',
  'documents.view_own', 'documents.manage', 'documents.send_for_signature', 'documents.sign', 'documents.view_audit',
  'electronic_documents.create_template', 'electronic_documents.edit_template', 'electronic_documents.send', 'electronic_documents.sign', 'electronic_documents.view_completed',
  'training.view_assigned', 'training.manage', 'training.assign', 'training.view_progress', 'training.edit_content', 'training.view_recipe_cost',
  'ai_reports.view', 'ai_reports.generate',
  'settings.view_profile', 'settings.manage_company', 'settings.manage_integrations', 'settings.manage_permissions',
  'chat.view', 'chat.create_room', 'chat.manage_room', 'chat.pin_message', 'chat.mention',
];

// Owner / Boss = same as CEO except cannot change company-level permission settings
const OWNER_BOSS_PERMISSIONS: Permission[] = CEO_PERMISSIONS.filter(
  (p) => p !== 'settings.manage_permissions' && p !== 'sales.permission_settings'
);

// Manager: operational admin. Several perms additionally gated by company toggles.
const MANAGER_PERMISSIONS: Permission[] = [
  'employee_management.view', 'employee_management.create', 'employee_management.edit',
  'schedule.view_own', 'schedule.manage', 'schedule.create', 'schedule.edit', 'schedule.delete', 'schedule.ai_recommend',
  'attendance.view_own', 'attendance.view_branch', 'attendance.edit',
  'leave.request', 'leave.approve', 'leave.reject', 'leave.view_all',
  // sales.* gated by allow_manager_sales_access / allow_manager_sales_detail_access
  'sales.view_summary', 'sales.view_detail', 'sales.import', 'sales.analytics',
  'inventory.view', 'inventory.manage', 'inventory.create', 'inventory.edit', 'inventory.delete',
  'purchase_orders.view', 'purchase_orders.create', 'purchase_orders.approve', 'purchase_orders.reject',
  // documents.manage gated by allow_manager_document_management
  'documents.view_own', 'documents.manage', 'documents.send_for_signature', 'documents.sign', 'documents.view_audit',
  'electronic_documents.create_template', 'electronic_documents.edit_template', 'electronic_documents.send', 'electronic_documents.sign', 'electronic_documents.view_completed',
  'training.view_assigned', 'training.manage', 'training.assign', 'training.view_progress', 'training.edit_content',
  // training.view_recipe_cost gated by allow_manager_recipe_cost_view
  'training.view_recipe_cost',
  // ai_reports.* gated by allow_manager_ai_report_access
  'ai_reports.view', 'ai_reports.generate',
  'settings.view_profile', 'settings.manage_company',
  // settings.manage_integrations gated by allow_manager_integration_access
  'settings.manage_integrations',
  'chat.view', 'chat.create_room', 'chat.manage_room', 'chat.pin_message', 'chat.mention',
];

const FULL_TIME_PERMISSIONS: Permission[] = [
  'schedule.view_own',
  'attendance.view_own',
  'leave.request',
  'documents.view_own', 'documents.sign',
  'electronic_documents.sign', 'electronic_documents.view_completed',
  'training.view_assigned',
  'settings.view_profile',
  'chat.view', 'chat.mention',
];

const PART_TIME_PERMISSIONS: Permission[] = [
  'schedule.view_own',
  'attendance.view_own',
  'leave.request',
  'documents.view_own', 'documents.sign',
  'electronic_documents.sign', 'electronic_documents.view_completed',
  'training.view_assigned',
  'settings.view_profile',
  'chat.view', 'chat.mention',
];

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  ceo: CEO_PERMISSIONS,
  owner: OWNER_BOSS_PERMISSIONS,
  boss: OWNER_BOSS_PERMISSIONS,
  manager: MANAGER_PERMISSIONS,
  full_time: FULL_TIME_PERMISSIONS,
  part_time: PART_TIME_PERMISSIONS,
  // Kitchen / hall staff are treated as part-time for permission purposes.
  kitchen_staff: PART_TIME_PERMISSIONS,
  hall_staff: PART_TIME_PERMISSIONS,
};

// Permissions that are revoked from 매니저 when a company toggle is OFF.
// Used to surface the "blocked by 대표 setting" reason in the route guard.
const MANAGER_TOGGLE_GATED: Partial<Record<Permission, keyof CompanySettings>> = {
  'sales.view_summary': 'allow_manager_sales_access',
  'sales.view_detail': 'allow_manager_sales_detail_access',
  'sales.import': 'allow_manager_sales_access',
  'sales.analytics': 'allow_manager_sales_access',
  'ai_reports.view': 'allow_manager_ai_report_access',
  'ai_reports.generate': 'allow_manager_ai_report_access',
  'documents.manage': 'allow_manager_document_management',
  'documents.view_audit': 'allow_manager_document_management',
  'electronic_documents.create_template': 'allow_manager_document_management',
  'electronic_documents.edit_template': 'allow_manager_document_management',
  'training.view_recipe_cost': 'allow_manager_recipe_cost_view',
  'settings.manage_integrations': 'allow_manager_integration_access',
};

// ============================================================================
// Core helpers
// ============================================================================

export const can = (
  role: AppRole | null | undefined,
  perm: Permission,
  settings: CompanySettings = DEFAULT_COMPANY_SETTINGS,
): boolean => {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role];
  if (!perms || !perms.includes(perm)) return false;

  // Apply manager toggles
  if (role === 'manager') {
    const toggle = MANAGER_TOGGLE_GATED[perm];
    if (toggle && !settings[toggle]) return false;
  }
  return true;
};

export const canAny = (
  role: AppRole | null | undefined,
  perms: Permission[],
  settings?: CompanySettings,
): boolean => perms.some((p) => can(role, p, settings));

export const canAll = (
  role: AppRole | null | undefined,
  perms: Permission[],
  settings?: CompanySettings,
): boolean => perms.every((p) => can(role, p, settings));

/**
 * Returns 'allowed' | 'denied' | 'blocked_by_company_setting' for a given permission
 * so the UI can show the correct reason. 'blocked_by_company_setting' is only
 * returned for 매니저 when the role would have the perm but a 대표 toggle disables it.
 */
export type AccessOutcome = 'allowed' | 'denied' | 'blocked_by_company_setting';

export const checkPermission = (
  role: AppRole | null | undefined,
  perm: Permission,
  settings: CompanySettings = DEFAULT_COMPANY_SETTINGS,
): AccessOutcome => {
  if (!role) return 'denied';
  const perms = ROLE_PERMISSIONS[role];
  if (!perms || !perms.includes(perm)) return 'denied';
  if (role === 'manager') {
    const toggle = MANAGER_TOGGLE_GATED[perm];
    if (toggle && !settings[toggle]) return 'blocked_by_company_setting';
  }
  return 'allowed';
};

// ============================================================================
// Menu / route mapping
// ============================================================================

export interface MenuMeta {
  /** Menu key used by sidebar/search/mobile nav. */
  key: string;
  /** Korean label shown in UI. */
  label: string;
  /** Route path. */
  path: string;
  /** Required permission(s) — visible if user has ANY of them. */
  requires: Permission[];
  /** Visual grouping for the sidebar. */
  group: '메인' | '인사' | '운영' | '관리' | '소통';
}

export const MENU_ITEMS: MenuMeta[] = [
  // Main
  { key: 'dashboard', label: '대시보드', path: '/', requires: ['settings.view_profile'], group: '메인' },
  { key: 'today_briefing', label: '오늘의 브리핑', path: '/today-briefing', requires: ['settings.view_profile'], group: '메인' },
  // HR
  { key: 'attendance', label: '출퇴근 관리', path: '/attendance', requires: ['attendance.view_own'], group: '인사' },
  { key: 'work_stats', label: '근무 통계', path: '/work-stats', requires: ['attendance.view_own'], group: '인사' },
  { key: 'my_schedule', label: '내 스케줄', path: '/schedule', requires: ['schedule.view_own'], group: '인사' },
  { key: 'schedule_management', label: '스케줄 관리', path: '/schedule-management', requires: ['schedule.manage'], group: '인사' },
  { key: 'ai_schedule', label: 'AI 스케줄 추천', path: '/ai-schedule', requires: ['schedule.ai_recommend'], group: '인사' },
  { key: 'leave', label: '휴가 관리', path: '/leave', requires: ['leave.request'], group: '인사' },
  // Operations
  { key: 'staff', label: '직원 관리', path: '/staff', requires: ['employee_management.view'], group: '운영' },
  { key: 'checklists', label: '체크리스트', path: '/checklists', requires: ['settings.view_profile'], group: '운영' },
  { key: 'reports', label: '일지/보고서', path: '/reports', requires: ['settings.view_profile'], group: '운영' },
  { key: 'sales', label: '매출 관리', path: '/sales', requires: ['sales.view_summary'], group: '운영' },
  { key: 'service_notes', label: '고객 서비스 노트', path: '/service-notes', requires: ['settings.view_profile'], group: '운영' },
  { key: 'ai_report', label: 'AI 매장 리포트', path: '/ai-report', requires: ['ai_reports.view'], group: '운영' },
  // Management
  { key: 'ingredients', label: '식재료 관리', path: '/ingredients', requires: ['inventory.view'], group: '관리' },
  { key: 'purchase_orders', label: '발주/입고', path: '/purchase-orders', requires: ['purchase_orders.view'], group: '관리' },
  { key: 'documents', label: '서류 관리', path: '/documents', requires: ['documents.view_own'], group: '관리' },
  { key: 'benefits', label: '복리후생', path: '/benefits', requires: ['settings.view_profile'], group: '관리' },
  { key: 'glossary', label: '용어/매뉴얼', path: '/glossary', requires: ['settings.view_profile'], group: '관리' },
  { key: 'knowledge', label: '교육/매뉴얼', path: '/knowledge', requires: ['training.view_assigned'], group: '관리' },
  // Communication
  { key: 'chat', label: '채팅', path: '/chat', requires: ['chat.view'], group: '소통' },
];

/**
 * Routes that require explicit permissions to access. Anything not listed
 * is treated as "any logged-in user".
 *
 * Path patterns may include `:param` segments — matching is prefix-based on
 * the static portion (good enough for our routes).
 */
export const ROUTE_REQUIREMENTS: { pattern: RegExp; requires: Permission[] }[] = [
  { pattern: /^\/staff(\/|$)/, requires: ['employee_management.view'] },
  { pattern: /^\/schedule-management(\/|$)/, requires: ['schedule.manage'] },
  { pattern: /^\/ai-schedule(\/|$)/, requires: ['schedule.ai_recommend'] },
  { pattern: /^\/ai-report(\/|$)/, requires: ['ai_reports.view'] },
  { pattern: /^\/sales\/import(\/|$)/, requires: ['sales.import'] },
  { pattern: /^\/sales\/entry(\/|$)/, requires: ['sales.view_detail'] },
  { pattern: /^\/sales(\/|$)/, requires: ['sales.view_summary'] },
  { pattern: /^\/ingredients(\/|$)/, requires: ['inventory.view'] },
  { pattern: /^\/purchase-orders(\/|$)/, requires: ['purchase_orders.view'] },
  { pattern: /^\/settings\/access-integration(\/|$)/, requires: ['settings.manage_integrations'] },
  { pattern: /^\/settings\/sales-access(\/|$)/, requires: ['sales.permission_settings'] },
  { pattern: /^\/documents\/templates(\/|$)/, requires: ['electronic_documents.create_template'] },
  { pattern: /^\/documents\/send(\/|$)/, requires: ['documents.send_for_signature'] },
  { pattern: /^\/knowledge\/articles\/new(\/|$)/, requires: ['training.edit_content'] },
  { pattern: /^\/knowledge\/recipes\/new(\/|$)/, requires: ['training.edit_content'] },
  { pattern: /^\/knowledge\/courses\/new(\/|$)/, requires: ['training.edit_content'] },
];

export const canViewMenu = (
  role: AppRole | null | undefined,
  menuKey: string,
  settings?: CompanySettings,
): boolean => {
  const item = MENU_ITEMS.find((m) => m.key === menuKey);
  if (!item) return false;
  return canAny(role, item.requires, settings);
};

export const visibleMenuItems = (
  role: AppRole | null | undefined,
  settings?: CompanySettings,
): MenuMeta[] => MENU_ITEMS.filter((m) => canAny(role, m.requires, settings));

export const checkRoute = (
  role: AppRole | null | undefined,
  path: string,
  settings: CompanySettings = DEFAULT_COMPANY_SETTINGS,
): AccessOutcome => {
  const match = ROUTE_REQUIREMENTS.find((r) => r.pattern.test(path));
  if (!match) return 'allowed';
  // Allowed if ANY required perm passes
  let bestOutcome: AccessOutcome = 'denied';
  for (const p of match.requires) {
    const outcome = checkPermission(role, p, settings);
    if (outcome === 'allowed') return 'allowed';
    if (outcome === 'blocked_by_company_setting') bestOutcome = 'blocked_by_company_setting';
  }
  return bestOutcome;
};

export const canAccessRoute = (
  role: AppRole | null | undefined,
  path: string,
  settings?: CompanySettings,
): boolean => checkRoute(role, path, settings) === 'allowed';
