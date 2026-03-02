import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusType = 'success' | 'warning' | 'destructive' | 'info' | 'default';

interface StatusBadgeProps {
  status: StatusType;
  label: string;
  className?: string;
}

const statusStyles: Record<StatusType, string> = {
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  destructive: 'bg-destructive/10 text-destructive border-destructive/20',
  info: 'bg-info/10 text-info border-info/20',
  default: 'bg-muted text-muted-foreground border-border',
};

const StatusBadge = ({ status, label, className }: StatusBadgeProps) => {
  return (
    <Badge variant="outline" className={cn('font-medium text-xs', statusStyles[status], className)}>
      {label}
    </Badge>
  );
};

export default StatusBadge;
