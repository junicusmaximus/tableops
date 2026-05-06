import { describe, it, expect } from 'vitest';
import { isManagerRole, type AppRole } from '@/hooks/useUserRole';

/**
 * Role-based UI snapshot tests.
 *
 * Captures the visible sidebar nav labels and key page-access flags per role,
 * so any future regression in role gating fails the snapshot.
 *
 * Mirrors the rules in:
 *   - src/components/layout/DesktopSidebar.tsx (managerOnly nav items)
 *   - Manager-only routes blocked for staff: /staff, /staff/:id,
 *     /schedule-management, /ai-schedule, /ai-report,
 *     /settings/access-integration, /sales, /ingredients, /purchase-orders
 */

// Mirror of DesktopSidebar navItems (label + managerOnly flag).
const NAV_ITEMS: { label: string; managerOnly?: boolean }[] = [
  { label: '대시보드' },
  { label: '오늘의 브리핑' },
  { label: '출퇴근 관리' },
  { label: '근무 통계' },
  { label: '내 스케줄' },
  { label: '스케줄 관리', managerOnly: true },
  { label: 'AI 스케줄 추천', managerOnly: true },
  { label: '휴가 관리' },
  { label: '직원 관리', managerOnly: true },
  { label: '체크리스트' },
  { label: '일지/보고서' },
  { label: '매출 관리', managerOnly: true },
  { label: '고객 서비스 노트' },
  { label: '식재료 관리', managerOnly: true },
  { label: '발주/입고', managerOnly: true },
  { label: '서류 관리' },
  { label: '복리후생' },
  { label: '용어/매뉴얼' },
  { label: '교육/매뉴얼' },
  { label: '채팅' },
  { label: 'AI 매장 리포트', managerOnly: true },
];

const MANAGER_ONLY_ROUTES = [
  '/staff',
  '/staff/123',
  '/schedule-management',
  '/ai-schedule',
  '/ai-report',
  '/sales',
  '/ingredients',
  '/purchase-orders',
  '/settings/access-integration',
];

const ROLES: AppRole[] = [
  'ceo',
  'boss',
  'owner',
  'manager',
  'full_time',
  'part_time',
  'hall_staff',
  'kitchen_staff',
];

const visibleNavFor = (role: AppRole) => {
  const isManager = isManagerRole(role);
  return NAV_ITEMS.filter((i) => !i.managerOnly || isManager).map((i) => i.label);
};

const accessibleRoutesFor = (role: AppRole) => {
  const isManager = isManagerRole(role);
  return MANAGER_ONLY_ROUTES.filter(() => isManager);
};

describe('role-based UI snapshot per role', () => {
  for (const role of ROLES) {
    it(`snapshot: ${role}`, () => {
      const snapshot = {
        role,
        isManager: isManagerRole(role),
        visibleNav: visibleNavFor(role),
        managerOnlyRoutesAccessible: accessibleRoutesFor(role),
      };
      expect(snapshot).toMatchSnapshot();
    });
  }

  it('manager roles see all nav items', () => {
    for (const role of ['ceo', 'boss', 'owner', 'manager'] as AppRole[]) {
      expect(visibleNavFor(role)).toHaveLength(NAV_ITEMS.length);
    }
  });

  it('staff roles do NOT see manager-only nav items', () => {
    const managerOnlyLabels = NAV_ITEMS.filter((i) => i.managerOnly).map((i) => i.label);
    for (const role of ['full_time', 'part_time', 'hall_staff', 'kitchen_staff'] as AppRole[]) {
      const visible = visibleNavFor(role);
      for (const label of managerOnlyLabels) {
        expect(visible).not.toContain(label);
      }
    }
  });

  it('staff roles cannot access manager-only routes', () => {
    for (const role of ['full_time', 'part_time', 'hall_staff', 'kitchen_staff'] as AppRole[]) {
      expect(accessibleRoutesFor(role)).toEqual([]);
    }
  });
});
