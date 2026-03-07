import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, ClipboardCheck, FileText,
  TrendingUp, MessageSquare, Settings, ChefHat, LogOut,
  Clock, CalendarDays, BookOpen
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  group?: string;
}

const navItems: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: '대시보드', group: '메인' },
  { to: '/staff', icon: Users, label: '직원 관리', group: '인사' },
  { to: '/attendance', icon: Clock, label: '근태 관리', group: '인사' },
  { to: '/schedule', icon: Calendar, label: '스케줄', group: '인사' },
  { to: '/checklists', icon: ClipboardCheck, label: '체크리스트', group: '운영' },
  { to: '/chat', icon: MessageSquare, label: '채팅', group: '소통' },
  { to: '/sales', icon: TrendingUp, label: '매출', group: '운영' },
  { to: '/reservations', icon: CalendarDays, label: '예약', group: '운영' },
  { to: '/reports', icon: FileText, label: '리포트', group: '분석' },
  { to: '/settings', icon: Settings, label: '설정', group: '시스템' },
];

const DesktopSidebar = () => {
  const { signOut } = useAuth();
  const location = useLocation();

  const groups = navItems.reduce((acc, item) => {
    const group = item.group || '기타';
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border h-screen fixed left-0 top-0 z-40">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-sidebar-primary">
          <ChefHat className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="font-bold text-sidebar-foreground text-lg leading-tight">TableOps</h1>
          <p className="text-xs text-sidebar-foreground/60">운영 관리</p>
        </div>
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
