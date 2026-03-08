import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Users, Plus, MessageSquare, Hash, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useChatRooms, useChatMessages, useSendMessage, useMarkAsRead, useCreateChatRoom } from '@/hooks/useChat';
import { format, isToday, isYesterday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';
import RoleBadge from '@/components/common/RoleBadge';
import ProfileCard from '@/components/profile/ProfileCard';
import StatusIndicator from '@/components/profile/StatusIndicator';

const formatMessageTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return format(d, 'HH:mm');
};

const formatRoomTime = (dateStr: string | undefined) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return '어제';
  return format(d, 'M/d', { locale: ko });
};

const Chat = () => {
  const { user } = useAuth();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: rooms = [], isLoading: roomsLoading } = useChatRooms();
  const { data: messages = [], isLoading: messagesLoading } = useChatMessages(selectedRoomId);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();
  const createRoom = useCreateChatRoom();

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedRoomId) {
      markAsRead(selectedRoomId);
    }
  }, [selectedRoomId, markAsRead]);

  const handleSend = () => {
    if (!message.trim() || !selectedRoomId) return;
    sendMessage.mutate(
      { roomId: selectedRoomId, content: message.trim() },
      {
        onSuccess: () => setMessage(''),
        onError: () => toast.error('메시지 전송에 실패했습니다'),
      }
    );
  };

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return;
    createRoom.mutate(
      { name: newRoomName.trim() },
      {
        onSuccess: (room) => {
          setSelectedRoomId(room.id);
          setNewRoomName('');
          setDialogOpen(false);
          toast.success('채팅방이 생성되었습니다');
        },
        onError: () => toast.error('채팅방 생성에 실패했습니다'),
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const RoomList = () => (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">채팅방</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 채팅방 만들기</DialogTitle>
            </DialogHeader>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="채팅방 이름"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
              />
              <Button onClick={handleCreateRoom} disabled={createRoom.isPending}>
                만들기
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto">
        {roomsLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">로딩 중...</div>
        ) : rooms.length === 0 ? (
          <div className="p-6 text-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">채팅방이 없습니다</p>
            <p className="text-xs text-muted-foreground mt-1">+ 버튼으로 새 채팅방을 만들어보세요</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={`w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors ${
                  selectedRoomId === room.id ? 'bg-muted' : ''
                }`}
              >
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  {room.type === 'announcement' ? (
                    <Hash className="w-4 h-4 text-primary" />
                  ) : (
                    <Users className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{room.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatRoomTime(room.last_message_at)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {room.last_message ?? '메시지가 없습니다'}
                  </p>
                </div>
                {(room.unread_count ?? 0) > 0 && (
                  <span className="shrink-0 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {room.unread_count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const MessagesPanel = () => (
    <Card className="flex flex-col overflow-hidden h-full">
      <CardHeader className="pb-3 border-b border-border flex-row items-center gap-2 space-y-0">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-8 w-8 shrink-0"
          onClick={() => setSelectedRoomId(null)}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <CardTitle className="text-base">{selectedRoom?.name ?? '채팅'}</CardTitle>
      </CardHeader>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messagesLoading ? (
            <div className="text-center text-sm text-muted-foreground py-8">로딩 중...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              첫 메시지를 보내보세요! 👋
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === user?.id;
              const isSystem = msg.message_type === 'system';

              if (isSystem) {
                return (
                  <div key={msg.id} className="text-center">
                    <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      {msg.content}
                    </span>
                  </div>
                );
              }

              const senderProfile = msg.sender_profile as any;

              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar for other users */}
                    {!isMine && (
                      <ProfileCard
                        name={msg.sender_name ?? '알 수 없음'}
                        role={senderProfile?.position}
                        imageUrl={senderProfile?.profile_image_url}
                        phone={senderProfile?.phone}
                        bio={senderProfile?.bio}
                        status={senderProfile?.status}
                      >
                        <button className="shrink-0 mt-1 cursor-pointer">
                          <div className="relative">
                            <Avatar className="w-8 h-8 border border-border">
                              <AvatarImage src={senderProfile?.profile_image_url ?? undefined} className="object-cover" />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {(msg.sender_name ?? '?').slice(0, 1)}
                              </AvatarFallback>
                            </Avatar>
                            {senderProfile?.status && senderProfile.status !== 'offline' && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background" style={{
                                backgroundColor: senderProfile.status === 'working' ? '#22c55e' : senderProfile.status === 'vacation' ? '#eab308' : '#f97316'
                              }} />
                            )}
                          </div>
                        </button>
                      </ProfileCard>
                    )}

                    <div>
                      {!isMine && (
                        <div className="flex items-center gap-1.5 mb-1 ml-1">
                          <ProfileCard
                            name={msg.sender_name ?? '알 수 없음'}
                            role={senderProfile?.position}
                            imageUrl={senderProfile?.profile_image_url}
                            phone={senderProfile?.phone}
                            bio={senderProfile?.bio}
                            status={senderProfile?.status}
                          >
                            <button className="text-xs font-medium hover:underline cursor-pointer">
                              {msg.sender_name}
                            </button>
                          </ProfileCard>
                          <RoleBadge role={senderProfile?.position} className="text-[9px] px-1.5 py-0" />
                        </div>
                      )}
                      <div className={`flex items-end gap-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                        <div
                          className={`px-3 py-2 rounded-2xl text-sm ${
                            isMine
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-muted rounded-bl-md'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatMessageTime(msg.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <Input
            placeholder="메시지를 입력하세요..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
            disabled={!selectedRoomId}
          />
          <Button
            size="icon"
            className="shrink-0"
            onClick={handleSend}
            disabled={!message.trim() || sendMessage.isPending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );

  const EmptyChat = () => (
    <Card className="flex flex-col items-center justify-center h-full">
      <MessageSquare className="w-12 h-12 text-muted-foreground mb-3" />
      <p className="text-muted-foreground text-sm">채팅방을 선택하세요</p>
    </Card>
  );

  return (
    <div className="animate-fade-in h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">채팅</h1>
      </div>

      <div className="hidden lg:grid lg:grid-cols-[300px_1fr] gap-4 h-[calc(100%-3rem)]">
        <RoomList />
        {selectedRoomId ? <MessagesPanel /> : <EmptyChat />}
      </div>

      <div className="lg:hidden h-[calc(100%-3rem)]">
        {selectedRoomId ? <MessagesPanel /> : <RoomList />}
      </div>
    </div>
  );
};

export default Chat;
