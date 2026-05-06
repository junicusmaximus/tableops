import { useCurrentRole } from '@/hooks/useUserRole';
import { useCompanySettings } from '@/hooks/useCompanySettings';

export interface SalesPermissions {
  canView: boolean;
  canManageSettings: boolean;
  canViewBranchComparison: boolean;
  canViewDetail: boolean;
  blockedReason: string | null;
  loading: boolean;
}

export const useSalesPermissions = (): SalesPermissions => {
  const role = useCurrentRole();
  const { data: settings, isLoading } = useCompanySettings();

  if (!role) {
    return {
      canView: false,
      canManageSettings: false,
      canViewBranchComparison: false,
      canViewDetail: false,
      blockedReason: null,
      loading: true,
    };
  }

  if (role === 'ceo' || role === 'owner') {
    return {
      canView: true,
      canManageSettings: role === 'ceo',
      canViewBranchComparison: true,
      canViewDetail: true,
      blockedReason: null,
      loading: false,
    };
  }
  if (role === 'boss') {
    return {
      canView: true,
      canManageSettings: false,
      canViewBranchComparison: true,
      canViewDetail: true,
      blockedReason: null,
      loading: false,
    };
  }
  if (role === 'manager') {
    const allow = settings?.allow_manager_sales_access ?? true;
    if (!allow) {
      return {
        canView: false,
        canManageSettings: false,
        canViewBranchComparison: false,
        canViewDetail: false,
        blockedReason: '대표자 권한 설정에 의해 매출 분석 접근이 제한되었습니다.',
        loading: isLoading,
      };
    }
    return {
      canView: true,
      canManageSettings: false,
      canViewBranchComparison: settings?.allow_manager_branch_comparison ?? false,
      canViewDetail: settings?.allow_manager_sales_detail_access ?? false,
      blockedReason: null,
      loading: isLoading,
    };
  }
  return {
    canView: false,
    canManageSettings: false,
    canViewBranchComparison: false,
    canViewDetail: false,
    blockedReason: '매출 분석은 대표/사장님/매니저 권한에서만 이용할 수 있습니다.',
    loading: false,
  };
};
