import { cn } from '@/lib/utils';

export type UserStatus = 'working' | 'vacation' | 'away' | 'offline';

const STATUS_CONFIG: Record<UserStatus, { color: string; label: string }> = {
  working: { color: 'bg-green-500', label: '근무중' },
  vacation: { color: 'bg-yellow-500', label: '휴가' },
  away: { color: 'bg-orange-500', label: '자리비움' },
  offline: { color: 'bg-gray-400', label: '오프라인' },
};

interface StatusIndicatorProps {
  status: string | null | undefined;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

const StatusIndicator = ({ status, size = 'sm', showLabel = true, className }: StatusIndicatorProps) => {
  const s = (status as UserStatus) ?? 'offline';
  const config = STATUS_CONFIG[s] ?? STATUS_CONFIG.offline;
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className={cn('rounded-full shrink-0', dotSize, config.color)} />
      {showLabel && <span className="text-xs text-muted-foreground">{config.label}</span>}
    </span>
  );
};

export default StatusIndicator;
