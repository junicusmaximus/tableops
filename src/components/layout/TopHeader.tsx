import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

const TopHeader = () => {
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: notifications = [] } = useNotifications();
  const unreadCount = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const handleNotifClick = (notif: typeof notifications[0]) => {
    if (!notif.is_read) {
      markAsRead.mutate(notif.id);
    }
    // Navigate to leave page if it's a leave-related notification
    if (notif.related_entity_type === 'leave_request') {
      navigate('/leave');
      setNotifOpen(false);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ko });
    } catch {
      return '';
    }
  };

  const searchResults = [
    { label: '식재료 관리', path: '/ingredients' },
    { label: '체크리스트', path: '/checklists' },
    { label: '스케줄 관리', path: '/schedule' },
    { label: '출퇴근 관리', path: '/attendance' },
    { label: '매출 관리', path: '/sales' },
    { label: '예약 관리', path: '/reservations' },
    { label: '일지/보고서', path: '/reports' },
    { label: '서류 관리', path: '/documents' },
    { label: '발주/입고', path: '/purchase-orders' },
    { label: '고객 서비스 노트', path: '/service-notes' },
    { label: '휴가 관리', path: '/leave' },
    { label: '복리후생', path: '/benefits' },
    { label: '용어/매뉴얼', path: '/glossary' },
    { label: '채팅', path: '/chat' },
    { label: '설정', path: '/settings' },
  ].filter(r => searchQuery && r.label.includes(searchQuery));

  return (
    <>
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 lg:px-6">
          <div className="lg:hidden">
            <h1 className="font-bold text-foreground text-lg">TableOps</h1>
          </div>
          <div className="hidden lg:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="메뉴 검색..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                className="h-9 w-64 rounded-lg border border-input bg-muted/50 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {searchQuery && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  onMouseDown={e => { e.preventDefault(); setSearchQuery(''); }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {searchOpen && searchQuery && (
                <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-64 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground text-center">검색 결과 없음</p>
                  ) : searchResults.map(r => (
                    <button
                      key={r.path}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 cursor-pointer transition-colors"
                      onMouseDown={e => {
                        e.preventDefault();
                        navigate(r.path);
                        setSearchQuery('');
                        setSearchOpen(false);
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative cursor-pointer" onClick={() => setNotifOpen(true)}>
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
        <SheetContent>
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle>알림</SheetTitle>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={() => markAllAsRead.mutate()} className="text-xs">
                  <Check className="w-3 h-3 mr-1" />모두 읽음
                </Button>
              )}
            </div>
          </SheetHeader>
          <div className="space-y-2 mt-4">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">알림이 없습니다.</p>
            ) : notifications.map(n => (
              <div
                key={n.id}
                className={`p-3 rounded-lg border border-border cursor-pointer transition-colors hover:bg-muted/50 ${
                  !n.is_read ? 'bg-primary/5 border-primary/20' : ''
                }`}
                onClick={() => handleNotifClick(n)}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{n.title}</p>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                </div>
                {n.message && <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>}
                <p className="text-xs text-muted-foreground mt-1">{formatTime(n.created_at)}</p>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default TopHeader;
