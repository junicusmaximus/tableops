import { useRef, useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Paperclip, Smile, ArrowLeft, Pin, Hash, Users, Search, X } from 'lucide-react';
import RoleBadge from '@/components/common/RoleBadge';
import ProfileCard from '@/components/profile/ProfileCard';
import type { ChatRoom, ChatMessage } from '@/hooks/useChat';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';

const formatMessageTime = (dateStr: string) => format(new Date(dateStr), 'a h:mm', { locale: ko });

const formatDateDivider = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isToday(d)) return '오늘';
  if (isYesterday(d)) return '어제';
  return format(d, 'yyyy년 M월 d일 EEEE', { locale: ko });
};

interface ChatMessageAreaProps {
  room: ChatRoom | undefined;
  messages: ChatMessage[];
  isLoading: boolean;
  currentUserId: string | undefined;
  message: string;
  onMessageChange: (val: string) => void;
  onSend: () => void;
  isSending: boolean;
  onBack?: () => void;
  showBackButton?: boolean;
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
}

const ChatMessageArea = ({
  room,
  messages,
  isLoading,
  currentUserId,
  message,
  onMessageChange,
  onSend,
  isSending,
  onBack,
  showBackButton,
  searchQuery,
  onSearchQueryChange,
}: ChatMessageAreaProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const filteredMessages = searchQuery
    ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  // Group consecutive messages from the same sender
  const shouldShowHeader = (msg: ChatMessage, index: number) => {
    if (index === 0) return true;
    const prev = messages[index - 1];
    if (prev.sender_id !== msg.sender_id) return true;
    if (prev.message_type === 'system') return true;
    // Show header if gap > 5 min
    const timeDiff = new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime();
    return timeDiff > 5 * 60 * 1000;
  };

  const shouldShowDateDivider = (msg: ChatMessage, index: number) => {
    if (index === 0) return true;
    const prev = messages[index - 1];
    return !isSameDay(new Date(msg.created_at), new Date(prev.created_at));
  };

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-muted/20">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <Hash className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">채팅방을 선택하세요</p>
            <p className="text-sm text-muted-foreground mt-1">왼쪽 목록에서 채팅방을 선택하여 대화를 시작하세요</p>
          </div>
        </div>
      </div>
    );
  }

  const RoomIcon = room.type === 'announcement' ? Hash : Users;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <RoomIcon className="w-4.5 h-4.5 text-muted-foreground" />
          <div>
            <h2 className="text-sm font-semibold leading-tight">{room.name}</h2>
            <p className="text-[11px] text-muted-foreground">
              {room.type === 'announcement' ? '공지 채널' : '그룹 채팅'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setShowSearch(!showSearch);
              if (showSearch) onSearchQueryChange('');
            }}
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <Input
            placeholder="메시지 검색..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="h-7 text-sm border-0 bg-transparent focus-visible:ring-0 px-0"
            autoFocus
          />
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => { setShowSearch(false); onSearchQueryChange(''); }}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-3 space-y-0.5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-sm text-muted-foreground">메시지를 불러오는 중...</div>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                <RoomIcon className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                {searchQuery ? '검색 결과가 없습니다' : `#${room.name} 채널의 시작입니다`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery ? '다른 키워드로 검색해보세요' : '첫 메시지를 보내보세요! 👋'}
              </p>
            </div>
          ) : (
            filteredMessages.map((msg, index) => {
              const isMine = msg.sender_id === currentUserId;
              const isSystem = msg.message_type === 'system';
              const showHeader = shouldShowHeader(msg, index);
              const showDate = shouldShowDateDivider(msg, index);
              const senderProfile = msg.sender_profile;

              return (
                <div key={msg.id}>
                  {/* Date divider */}
                  {showDate && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[11px] font-medium text-muted-foreground px-2">
                        {formatDateDivider(msg.created_at)}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}

                  {/* System message */}
                  {isSystem ? (
                    <div className="flex justify-center my-2">
                      <span className="text-[11px] text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        {msg.content}
                      </span>
                    </div>
                  ) : (
                    /* Slack-style message row */
                    <div className={`group flex gap-2.5 px-1 py-0.5 rounded-md hover:bg-muted/30 transition-colors ${showHeader ? 'mt-3' : ''}`}>
                      {/* Avatar column */}
                      <div className="w-9 shrink-0 pt-0.5">
                        {showHeader && !isMine ? (
                          <ProfileCard
                            name={msg.sender_name ?? '알 수 없음'}
                            role={senderProfile?.position}
                            imageUrl={senderProfile?.profile_image_url}
                            phone={senderProfile?.phone}
                            bio={senderProfile?.bio}
                            status={senderProfile?.status}
                          >
                            <button className="cursor-pointer">
                              <div className="relative">
                                <Avatar className="w-9 h-9 border border-border">
                                  <AvatarImage src={senderProfile?.profile_image_url ?? undefined} className="object-cover" />
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                                    {(msg.sender_name ?? '?').slice(0, 1)}
                                  </AvatarFallback>
                                </Avatar>
                                {senderProfile?.status && senderProfile.status !== 'offline' && (
                                  <span
                                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background"
                                    style={{
                                      backgroundColor:
                                        senderProfile.status === 'working'
                                          ? '#22c55e'
                                          : senderProfile.status === 'vacation'
                                          ? '#eab308'
                                          : '#f97316',
                                    }}
                                  />
                                )}
                              </div>
                            </button>
                          </ProfileCard>
                        ) : showHeader && isMine ? (
                          <div className="relative">
                            <Avatar className="w-9 h-9 border border-border">
                              <AvatarImage src={senderProfile?.profile_image_url ?? undefined} className="object-cover" />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                                {(msg.sender_name ?? '?').slice(0, 1)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        ) : (
                          /* Timestamp on hover for grouped messages */
                          <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity pt-1 text-center block">
                            {format(new Date(msg.created_at), 'HH:mm')}
                          </span>
                        )}
                      </div>

                      {/* Content column */}
                      <div className="flex-1 min-w-0">
                        {showHeader && (
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <ProfileCard
                              name={msg.sender_name ?? '알 수 없음'}
                              role={senderProfile?.position}
                              imageUrl={senderProfile?.profile_image_url}
                              phone={senderProfile?.phone}
                              bio={senderProfile?.bio}
                              status={senderProfile?.status}
                            >
                              <button className="text-sm font-semibold hover:underline cursor-pointer text-foreground">
                                {msg.sender_name}
                              </button>
                            </ProfileCard>
                            <RoleBadge role={senderProfile?.position} className="text-[9px] px-1.5 py-0" />
                            <span className="text-[11px] text-muted-foreground">
                              {formatMessageTime(msg.created_at)}
                            </span>
                          </div>
                        )}
                        <p className="text-sm text-foreground leading-relaxed break-words whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-end gap-2 bg-muted/40 rounded-xl border border-border px-3 py-2 focus-within:ring-1 focus-within:ring-primary/50 focus-within:border-primary/50 transition-all">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground">
            <Paperclip className="w-4 h-4" />
          </Button>
          <Input
            placeholder={`#${room.name}에 메시지 보내기`}
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 px-0 text-sm min-h-[32px]"
          />
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground">
            <Smile className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            className="h-8 w-8 shrink-0 rounded-lg"
            onClick={onSend}
            disabled={!message.trim() || isSending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatMessageArea;
