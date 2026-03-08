import { Badge } from '@/components/ui/badge';
import { ROLE_LABELS, type AppRole } from '@/hooks/useUserRole';
import { cn } from '@/lib/utils';

const ROLE_COLORS: Record<AppRole, string> = {
  ceo: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
  owner: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
  boss: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  full_time: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
  part_time: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-200 dark:border-gray-800',
  kitchen_staff: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  hall_staff: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200 dark:border-teal-800',
};

interface RoleBadgeProps {
  role: string | null | undefined;
  className?: string;
}

const RoleBadge = ({ role, className }: RoleBadgeProps) => {
  if (!role) return null;
  const label = ROLE_LABELS[role as AppRole] ?? role;
  const colorClass = ROLE_COLORS[role as AppRole] ?? 'bg-muted text-muted-foreground';

  return (
    <Badge variant="outline" className={cn('text-[11px] font-medium px-2 py-0.5 border', colorClass, className)}>
      {label}
    </Badge>
  );
};

export default RoleBadge;
