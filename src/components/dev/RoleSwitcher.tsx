import { useState } from 'react';
import { Shield, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  AppRole,
  ROLE_LABELS,
  getRoleOverride,
  setRoleOverride,
  useCurrentRole,
  useRoleOverride,
} from '@/hooks/useUserRole';

const TEST_ROLES: AppRole[] = ['ceo', 'manager', 'full_time', 'part_time', 'hall_staff', 'kitchen_staff'];

// Show only in dev/staging — hidden on production domains
const isDevOrStaging = (): boolean => {
  if (import.meta.env.DEV) return true;
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return (
    host === 'localhost' ||
    host.endsWith('.lovableproject.com') ||
    host.endsWith('.lovable.app') // includes id-preview--*.lovable.app (staging)
      && !host.endsWith('.app.lovable.app') // safety placeholder
  ) && !host.startsWith('app.'); // exclude prod custom subdomains like app.<custom>
};

const RoleSwitcher = () => {
  const override = useRoleOverride();
  const current = useCurrentRole();
  const [open, setOpen] = useState(false);

  if (!isDevOrStaging()) return null;

  const apply = (role: AppRole | null) => {
    setRoleOverride(role);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-dashed border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10 text-xs text-amber-600 dark:text-amber-400 transition-colors"
          title="테스트용 권한 전환"
        >
          <Shield className="w-3 h-3" />
          <span className="hidden sm:inline">권한 테스트</span>
          {override && (
            <Badge variant="secondary" className="h-4 px-1 text-[10px]">
              {ROLE_LABELS[override]}
            </Badge>
          )}
          <ChevronDown className="w-3 h-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs">
          테스트용 권한 전환
          <div className="text-[10px] text-muted-foreground font-normal mt-0.5">
            UI 표시만 변경됩니다 (DB 권한은 유지)
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => apply(null)} className="text-xs">
          <span className="flex-1">실제 권한 사용</span>
          {!override && current && (
            <Badge variant="outline" className="h-4 text-[10px]">
              {ROLE_LABELS[current]}
            </Badge>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {TEST_ROLES.map((r) => (
          <DropdownMenuItem
            key={r}
            onClick={() => apply(r)}
            className="text-xs"
          >
            <span className="flex-1">{ROLE_LABELS[r]}</span>
            {override === r && <span className="text-amber-500">●</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RoleSwitcher;
