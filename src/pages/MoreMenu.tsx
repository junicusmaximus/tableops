import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar, ClipboardCheck, FileText, TrendingUp, Users,
  AlertTriangle, ShoppingCart, Briefcase, Upload, Gift,
  BookOpen, Bell, Store, Settings, Coffee, Notebook, Sparkles, Brain, GraduationCap
} from 'lucide-react';

const menuItems = [
  { to: '/today-briefing', icon: Coffee, label: '오늘의 브리핑', color: 'text-accent' },
  { to: '/attendance', icon: Calendar, label: '출퇴근', color: 'text-primary' },
  { to: '/schedule', icon: Calendar, label: '스케줄', color: 'text-info' },
  { to: '/leave', icon: Briefcase, label: '휴가', color: 'text-warning' },
  { to: '/checklists', icon: ClipboardCheck, label: '체크리스트', color: 'text-warning' },
  { to: '/reports', icon: FileText, label: '일지/보고서', color: 'text-success' },
  { to: '/sales', icon: TrendingUp, label: '매출', color: 'text-primary' },
  { to: '/service-notes', icon: Notebook, label: '고객 노트', color: 'text-accent' },
  { to: '/ingredients', icon: AlertTriangle, label: '식재료', color: 'text-destructive' },
  { to: '/purchase-orders', icon: ShoppingCart, label: '발주/입고', color: 'text-info' },
  { to: '/documents', icon: Upload, label: '서류', color: 'text-muted-foreground' },
  { to: '/benefits', icon: Gift, label: '복리후생', color: 'text-accent' },
  { to: '/glossary', icon: BookOpen, label: '용어사전', color: 'text-primary' },
  { to: '/announcements', icon: Bell, label: '공지사항', color: 'text-info' },
  { to: '/staff', icon: Users, label: '직원 관리', color: 'text-success' },
  { to: '/stores', icon: Store, label: '매장 관리', color: 'text-success' },
  { to: '/ai-schedule', icon: Sparkles, label: 'AI 스케줄', color: 'text-primary' },
  { to: '/ai-report', icon: Brain, label: 'AI 리포트', color: 'text-primary' },
  { to: '/settings', icon: Settings, label: '설정', color: 'text-muted-foreground' },
];

const MoreMenu = () => {
  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold">더보기</h1>
      <div className="grid grid-cols-3 gap-3">
        {menuItems.map((item) => (
          <Link key={item.to} to={item.to}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4 pb-3 text-center">
                <item.icon className={`w-6 h-6 mx-auto mb-2 ${item.color}`} />
                <p className="text-xs font-medium">{item.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MoreMenu;
