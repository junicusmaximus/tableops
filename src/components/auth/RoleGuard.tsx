import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Permission } from '@/lib/permissions';

interface RoleGuardProps {
  /** Optional explicit perm; if omitted, uses ROUTE_REQUIREMENTS by current path. */
  perm?: Permission;
  children: React.ReactNode;
}

/**
 * Route-level guard: if the current role cannot access the route (or the
 * given permission), renders a clean "no access" panel with the proper
 * reason. Hidden pages cannot be reached by direct URL.
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({ perm, children }) => {
  const location = useLocation();
  const { role, isLoading, checkPermission, checkRoute } = usePermissions();

  if (isLoading) return null;

  const outcome = perm
    ? checkPermission(perm)
    : checkRoute(location.pathname);

  if (outcome === 'allowed') return <>{children}</>;

  // Unauthenticated should not normally reach here (ProtectedRoute handles it),
  // but guard against null role just in case.
  if (!role) return <Navigate to="/login" replace />;

  const message =
    outcome === 'blocked_by_company_setting'
      ? '대표자 권한 설정에 의해 접근이 제한되었습니다.'
      : '접근 권한이 없습니다.';

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
            <ShieldOff className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">{message}</h2>
          <p className="text-sm text-muted-foreground">
            현재 역할로는 이 페이지를 사용할 수 없습니다.
          </p>
          <Button variant="outline" onClick={() => window.history.back()}>
            이전 페이지로
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleGuard;
