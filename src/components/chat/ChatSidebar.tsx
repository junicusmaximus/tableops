import { Hash, Users, MessageSquare, Megaphone, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';
import type { ChatRoom } from '@/hooks/useChat';
import { format, isToday, isYesterday } from 'date-fns';
import { ko } from 'date-fns/locale';

const formatRoomTime = (dateStr: string | undefined) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return '어제';
  return format(d, 'M/d', { locale: ko });
};

const ROOM_TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  announcement: { icon: Megaphone, color: 'text-destructive' },
  channel: { icon: Hash, color: 'text-primary' },
  group: { icon: Users, color: 'text-primary' },
  dm: { icon: MessageSquare, color: 'text-muted-foreground' },
};

interface ChatSidebarProps {
  rooms: ChatRoom[];
  isLoading: boolean;
  selectedRoomId: string | null;
  onSelectRoom: (id: string) => void;
  onCreateRoom: () => void;
}

const ChatSidebar = ({ rooms, isLoading, selectedRoomId, onSelectRoom, onCreateRoom }: ChatSidebarProps) => {
  const [search, setSearch] = useState('');

  const channels = rooms.filter((r) => r.type === 'channel' || r.type === 'announcement');
  const groups = rooms.filter((r) => r.type === 'group' || r.type === 'dm');

  const filterRooms = (list: ChatRoom[]) =>
    search ? list.filter((r) => r.name.toLowerCase().includes(search.toLowerCase())) : list;

  const RoomItem = ({ room }: { room: ChatRoom }) => {
    const config = ROOM_TYPE_CONFIG[room.type] ?? ROOM_TYPE_CONFIG.group;
    const Icon = config.icon;
    const isActive = selectedRoomId === room.id;

    return (
      <button
        onClick={() => onSelectRoom(room.id)}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-colors group ${
          isActive
            ? 'bg-primary/10 text-foreground'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
        }`}
      >
        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : config.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className={`text-sm truncate ${isActive ? 'font-semibold' : 'font-medium'}`}>{room.name}</span>
            {room.last_message_at && (
              <span className="text-[10px] text-muted-foreground shrink-0">
                {formatRoomTime(room.last_message_at)}
              </span>
            )}
          </div>
          {room.last_message && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{room.last_message}</p>
          )}
        </div>
        {(room.unread_count ?? 0) > 0 && (
          <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
            {room.unread_count! > 99 ? '99+' : room.unread_count}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full border-r border-border bg-card">
      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="채널 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {isLoading ? (
            <div className="p-4 text-center text-xs text-muted-foreground">로딩 중...</div>
          ) : rooms.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">채팅방이 없습니다</p>
            </div>
          ) : (
            <>
              {/* Channels */}
              {filterRooms(channels).length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-3 mb-1">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">채널</span>
                  </div>
                  <div className="space-y-0.5">
                    {filterRooms(channels).map((room) => (
                      <RoomItem key={room.id} room={room} />
                    ))}
                  </div>
                </div>
              )}

              {/* Groups / DMs */}
              {filterRooms(groups).length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-3 mb-1">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">그룹 채팅</span>
                  </div>
                  <div className="space-y-0.5">
                    {filterRooms(groups).map((room) => (
                      <RoomItem key={room.id} room={room} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Create button */}
      <div className="p-3 border-t border-border">
        <button
          onClick={onCreateRoom}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-md transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          <span>새 채팅방</span>
        </button>
      </div>
    </div>
  );
};

export default ChatSidebar;
