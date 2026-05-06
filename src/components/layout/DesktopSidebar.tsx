import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, ClipboardCheck, FileText,
  TrendingUp, MessageSquare, Settings, ChefHat, LogOut,
  Clock, CalendarDays, BookOpen, Coffee, Briefcase,
  AlertTriangle, ShoppingCart, Upload, Gift, Notebook, CalendarCog,
  Brain, Sparkles, GraduationCap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsManager, useCurrentRole } from '@/hooks/useUserRole';
import RoleBadge from '@/components/common/RoleBadge';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  group: string;
  managerOnly?: boolean;
}

const navItems: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: '대시보드', group: '메인' },
  { to: '/today-briefing', icon: Coffee, label: '오늘의 브리핑', group: '메인' },
  { to: '/attendance', icon: Clock, label: '출퇴근 관리', group: '인사' },
  { to: '/work-stats', icon: TrendingUp, label: '근무 통계', group: '인사' },
  { to: '/schedule', icon: Calendar, label: '내 스케줄', group: '인사' },
  { to: '/schedule-management', icon: CalendarCog, label: '스케줄 관리', group: '인사', managerOnly: true },
  { to: '/ai-schedule', icon: Sparkles, label: 'AI 스케줄 추천', group: '인사', managerOnly: true },
  { to: '/leave', icon: Briefcase, label: '휴가 관리', group: '인사' },
  { to: '/staff', icon: Users, label: '직원 관리', group: '운영', managerOnly: true },
  { to: '/checklists', icon: ClipboardCheck, label: '체크리스트', group: '운영' },
  { to: '/reports', icon: FileText, label: '일지/보고서', group: '운영' },
  { to: '/sales', icon: TrendingUp, label: '매출 관리', group: '운영', managerOnly: true },
  { to: '/service-notes', icon: Notebook, label: '고객 서비스 노트', group: '운영' },
  { to: '/ingredients', icon: AlertTriangle, label: '식재료 관리', group: '관리', managerOnly: true },
  { to: '/purchase-orders', icon: ShoppingCart, label: '발주/입고', group: '관리', managerOnly: true },
  { to: '/documents', icon: Upload, label: '서류 관리', group: '관리' },
  { to: '/benefits', icon: Gift, label: '복리후생', group: '관리' },
  { to: '/glossary', icon: BookOpen, label: '용어/매뉴얼', group: '관리' },
  { to: '/chat', icon: MessageSquare, label: '채팅', group: '소통' },
  { to: '/ai-report', icon: Brain, label: 'AI 매장 리포트', group: '운영', managerOnly: true },
];

const DesktopSidebar = () => {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const isManager = useIsManager();
  const currentRole = useCurrentRole();

  const visibleItems = navItems.filter((item) => !item.managerOnly || isManager);

  const groups = visibleItems.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '사용자';

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border h-screen fixed left-0 top-0 z-40">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-sidebar-primary">
          <ChefHat className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="font-heading font-bold text-sidebar-foreground text-lg leading-tight tracking-tight">TableOps</h1>
          <p className="text-[10px] text-sidebar-foreground/50 font-medium tracking-wide uppercase">Restaurant Ops</p>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-sidebar-border">
        <p className="text-sm font-medium text-sidebar-foreground truncate">{displayName}</p>
        <RoleBadge role={currentRole} className="mt-1" />
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 px-3 mb-1">
              {group}
            </p>
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5',
                  location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))
                    ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </ScrollArea>

      <div className="p-3 border-t border-sidebar-border">
        <NavLink
          to="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-1',
            location.pathname === '/settings'
              ? 'bg-sidebar-accent text-sidebar-primary font-medium'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
          )}
        >
          <Settings className="w-4 h-4" />
          <span>설정</span>
        </NavLink>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
