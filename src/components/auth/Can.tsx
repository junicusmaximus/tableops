import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import type { Permission } from '@/lib/permissions';

interface CanProps {
  /** Single permission required. */
  perm?: Permission;
  /** Any-of: render if user has ANY of these. */
  any?: Permission[];
  /** All-of: render if user has ALL of these. */
  all?: Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Render gate by permission. Hides children completely when not allowed
 * (no disabled state). Use `fallback` only when you need a placeholder.
 */
export const Can: React.FC<CanProps> = ({ perm, any, all, children, fallback = null }) => {
  const { can, canAny, canAll, isLoading } = usePermissions();
  if (isLoading) return null;
  let allowed = true;
  if (perm) allowed = allowed && can(perm);
  if (any && any.length) allowed = allowed && canAny(any);
  if (all && all.length) allowed = allowed && canAll(all);
  return <>{allowed ? children : fallback}</>;
};

export default Can;
