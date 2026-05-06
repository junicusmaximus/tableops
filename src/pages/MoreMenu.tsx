import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar, ClipboardCheck, FileText, TrendingUp, Users,
  AlertTriangle, ShoppingCart, Briefcase, Upload, Gift,
  BookOpen, Bell, Store, Settings, Coffee, Notebook, Sparkles, Brain, GraduationCap,
  Clock, MessageSquare, CalendarCog, LayoutDashboard,
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { canViewMenu, type Permission } from '@/lib/permissions';
import { useCurrentRole } from '@/hooks/useUserRole';

interface MoreItem {
  to: string;
  icon: React.ElementType;
  label: string;
  color: string;
  // Either a menu key (uses MENU_ITEMS perms) or explicit perms
  menuKey?: string;
  perms?: Permission[];
}

const items: MoreItem[] = [
  { to: '/today-briefing', icon: Coffee, label: '오늘의 브리핑', color: 'text-accent', menuKey: 'today_briefing' },
  { to: '/attendance', icon: Clock, label: '출퇴근', color: 'text-primary', menuKey: 'attendance' },
  { to: '/schedule', icon: Calendar, label: '내 스케줄', color: 'text-info', menuKey: 'my_schedule' },
  { to: '/schedule-management', icon: CalendarCog, label: '스케줄 관리', color: 'text-info', menuKey: 'schedule_management' },
  { to: '/leave', icon: Briefcase, label: '휴가', color: 'text-warning', menuKey: 'leave' },
  { to: '/checklists', icon: ClipboardCheck, label: '체크리스트', color: 'text-warning', menuKey: 'checklists' },
  { to: '/reports', icon: FileText, label: '일지/보고서', color: 'text-success', menuKey: 'reports' },
  { to: '/sales', icon: TrendingUp, label: '매출', color: 'text-primary', menuKey: 'sales' },
  { to: '/service-notes', icon: Notebook, label: '고객 노트', color: 'text-accent', menuKey: 'service_notes' },
  { to: '/ingredients', icon: AlertTriangle, label: '식재료', color: 'text-destructive', menuKey: 'ingredients' },
  { to: '/purchase-orders', icon: ShoppingCart, label: '발주/입고', color: 'text-info', menuKey: 'purchase_orders' },
  { to: '/documents', icon: Upload, label: '서류', color: 'text-muted-foreground', menuKey: 'documents' },
  { to: '/benefits', icon: Gift, label: '복리후생', color: 'text-accent', menuKey: 'benefits' },
  { to: '/glossary', icon: BookOpen, label: '용어사전', color: 'text-primary', menuKey: 'glossary' },
  { to: '/knowledge', icon: GraduationCap, label: '교육/매뉴얼', color: 'text-accent', menuKey: 'knowledge' },
  { to: '/announcements', icon: Bell, label: '공지사항', color: 'text-info', perms: ['settings.view_profile'] },
  { to: '/staff', icon: Users, label: '직원 관리', color: 'text-success', menuKey: 'staff' },
  { to: '/stores', icon: Store, label: '매장 관리', color: 'text-success', perms: ['settings.manage_company'] },
  { to: '/ai-schedule', icon: Sparkles, label: 'AI 스케줄', color: 'text-primary', menuKey: 'ai_schedule' },
  { to: '/ai-report', icon: Brain, label: 'AI 리포트', color: 'text-primary', menuKey: 'ai_report' },
  { to: '/settings', icon: Settings, label: '설정', color: 'text-muted-foreground', perms: ['settings.view_profile'] },
];

const MoreMenu = () => {
  const { settings, canAny } = usePermissions();
  const role = useCurrentRole();

  const visible = items.filter((it) => {
    if (it.menuKey) return canViewMenu(role, it.menuKey, settings);
    if (it.perms) return canAny(it.perms);
    return true;
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold">더보기</h1>
      <div className="grid grid-cols-3 gap-3">
        {visible.map((item) => (
          <Link key={item.to} to={item.to}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4 pb-3 text-center">
                <item.icon className={`w-6 h-6 mx-auto mb-2 ${item.color}`} />
                <p className="text-xs font-medium">{item.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {visible.length === 0 && (
          <p className="col-span-3 text-center text-sm text-muted-foreground py-12">
            접근 가능한 메뉴가 없습니다.
          </p>
        )}
      </div>
    </div>
  );
};

export default MoreMenu;
