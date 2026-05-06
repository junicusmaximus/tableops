import { describe, it, expect } from 'vitest';
import {
  can,
  canAccessRoute,
  visibleMenuItems,
  checkRoute,
  DEFAULT_COMPANY_SETTINGS,
  type CompanySettings,
} from '@/lib/permissions';
import type { AppRole } from '@/hooks/useUserRole';

const ROLES: AppRole[] = [
  'ceo', 'owner', 'boss', 'manager',
  'full_time', 'part_time', 'hall_staff', 'kitchen_staff',
];

const off: CompanySettings = {
  ...DEFAULT_COMPANY_SETTINGS,
  allow_manager_sales_access: false,
  allow_manager_ai_report_access: false,
  allow_manager_document_management: false,
  allow_manager_recipe_cost_view: false,
  allow_manager_integration_access: false,
};

describe('permissions snapshot per role', () => {
  for (const role of ROLES) {
    it(`default settings: ${role}`, () => {
      expect({
        role,
        menus: visibleMenuItems(role).map((m) => m.key),
        canStaff: can(role, 'employee_management.view'),
        canSales: can(role, 'sales.view_summary'),
        canAiReport: can(role, 'ai_reports.view'),
        canIntegrations: can(role, 'settings.manage_integrations'),
        canPermissionSettings: can(role, 'settings.manage_permissions'),
      }).toMatchSnapshot();
    });
  }

  it('manager loses gated perms when company toggles are OFF', () => {
    expect(can('manager', 'sales.view_summary', off)).toBe(false);
    expect(can('manager', 'ai_reports.view', off)).toBe(false);
    expect(can('manager', 'documents.manage', off)).toBe(false);
    expect(can('manager', 'training.view_recipe_cost', off)).toBe(false);
    expect(can('manager', 'settings.manage_integrations', off)).toBe(false);
    // CEO unaffected by manager toggles
    expect(can('ceo', 'sales.view_summary', off)).toBe(true);
    expect(can('ceo', 'ai_reports.view', off)).toBe(true);
  });

  it('staff cannot reach manager-only routes', () => {
    for (const role of ['full_time', 'part_time', 'hall_staff', 'kitchen_staff'] as AppRole[]) {
      expect(canAccessRoute(role, '/staff')).toBe(false);
      expect(canAccessRoute(role, '/sales')).toBe(false);
      expect(canAccessRoute(role, '/schedule-management')).toBe(false);
      expect(canAccessRoute(role, '/ingredients')).toBe(false);
      expect(canAccessRoute(role, '/purchase-orders')).toBe(false);
      expect(canAccessRoute(role, '/ai-report')).toBe(false);
      expect(canAccessRoute(role, '/settings/access-integration')).toBe(false);
    }
  });

  it('blocked-by-toggle is distinguishable from denied', () => {
    expect(checkRoute('manager', '/sales', off)).toBe('blocked_by_company_setting');
    expect(checkRoute('manager', '/sales')).toBe('allowed');
    expect(checkRoute('part_time', '/sales')).toBe('denied');
  });

  it('only CEO can change permission settings', () => {
    expect(can('ceo', 'settings.manage_permissions')).toBe(true);
    expect(can('owner', 'settings.manage_permissions')).toBe(false);
    expect(can('boss', 'settings.manage_permissions')).toBe(false);
    expect(can('manager', 'settings.manage_permissions')).toBe(false);
    expect(canAccessRoute('manager', '/settings/sales-access')).toBe(false);
    expect(canAccessRoute('ceo', '/settings/sales-access')).toBe(true);
  });
});
