import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, ClipboardCheck, FileText,
  TrendingUp, MessageSquare, Settings, ChefHat, LogOut,
  Clock, CalendarDays, BookOpen, Coffee, Briefcase,
  AlertTriangle, ShoppingCart, Upload, Gift, Notebook, CalendarCog,
  Brain, Sparkles, GraduationCap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentRole } from '@/hooks/useUserRole';
import { usePermissions } from '@/hooks/usePermissions';
import RoleBadge from '@/components/common/RoleBadge';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

// Icon registry keyed by menu key from src/lib/permissions.ts.
// Visibility/labels/paths/groups all come from MENU_ITEMS — this only
// supplies icons + a few entries (work_stats) that aren't in the main
// menu list but live in the sidebar.
const MENU_ICONS: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  today_briefing: Coffee,
  attendance: Clock,
  work_stats: TrendingUp,
  my_schedule: Calendar,
  schedule_management: CalendarCog,
  ai_schedule: Sparkles,
  leave: Briefcase,
  staff: Users,
  checklists: ClipboardCheck,
  reports: FileText,
  sales: TrendingUp,
  service_notes: Notebook,
  ingredients: AlertTriangle,
  purchase_orders: ShoppingCart,
  documents: Upload,
  benefits: Gift,
  glossary: BookOpen,
  knowledge: GraduationCap,
  chat: MessageSquare,
  ai_report: Brain,
};

const DesktopSidebar = () => {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const currentRole = useCurrentRole();
  const { visibleMenu } = usePermissions();

  const visibleItems = visibleMenu().map((m) => ({
    to: m.path,
    icon: MENU_ICONS[m.key] ?? LayoutDashboard,
    label: m.label,
    group: m.group,
  }));

  const groups = visibleItems.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof visibleItems>);

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
