import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Clock, Coffee, MessageSquare, MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { to: '/', icon: LayoutDashboard, label: '홈' },
  { to: '/attendance', icon: Clock, label: '출퇴근' },
  { to: '/today-briefing', icon: Coffee, label: '브리핑' },
  { to: '/chat', icon: MessageSquare, label: '채팅' },
  { to: '/more', icon: MoreHorizontal, label: '더보기' },
];

const MobileBottomNav = () => {
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="flex items-center justify-around h-16 px-2 safe-area-bottom">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.to;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <tab.icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
