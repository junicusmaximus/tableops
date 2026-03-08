import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChatRooms, useChatMessages, useSendMessage, useMarkAsRead, useCreateChatRoom } from '@/hooks/useChat';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { toast } from 'sonner';
import ChatWorkspace from '@/components/chat/ChatWorkspace';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatMessageArea from '@/components/chat/ChatMessageArea';
import CreateRoomDialog from '@/components/chat/CreateRoomDialog';

const Chat = () => {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  const { data: rooms = [], isLoading: roomsLoading } = useChatRooms();
  const { data: messages = [], isLoading: messagesLoading } = useChatMessages(selectedRoomId);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();
  const createRoom = useCreateChatRoom();

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  useEffect(() => {
    if (selectedRoomId) {
      markAsRead(selectedRoomId);
    }
  }, [selectedRoomId, markAsRead]);

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    setMobileView('chat');
    setSearchQuery('');
  };

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

  const handleCreateRoom = (name: string, type: string) => {
    createRoom.mutate(
      { name, type },
      {
        onSuccess: (room) => {
          setSelectedRoomId(room.id);
          setDialogOpen(false);
          setMobileView('chat');
          toast.success('채팅방이 생성되었습니다');
        },
        onError: () => toast.error('채팅방 생성에 실패했습니다'),
      }
    );
  };

  const handleBack = () => {
    setMobileView('list');
    setSelectedRoomId(null);
  };

  return (
    <div className="animate-fade-in h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] -mx-4 lg:-mx-6 -mt-4 lg:-mt-6">
      {/* Desktop Layout: 3-column */}
      <div className="hidden lg:flex h-full border border-border rounded-xl overflow-hidden shadow-sm">
        {/* Column 1: Workspace */}
        <ChatWorkspace profile={profile} storeName={profile?.full_name} />

        {/* Column 2: Room list */}
        <div className="w-[260px] shrink-0">
          <ChatSidebar
            rooms={rooms}
            isLoading={roomsLoading}
            selectedRoomId={selectedRoomId}
            onSelectRoom={handleSelectRoom}
            onCreateRoom={() => setDialogOpen(true)}
          />
        </div>

        {/* Column 3: Messages */}
        <div className="flex-1">
          <ChatMessageArea
            room={selectedRoom}
            messages={messages}
            isLoading={messagesLoading}
            currentUserId={user?.id}
            message={message}
            onMessageChange={setMessage}
            onSend={handleSend}
            isSending={sendMessage.isPending}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
          />
        </div>
      </div>

      {/* Mobile Layout: list or chat */}
      <div className="lg:hidden h-full">
        {mobileView === 'list' ? (
          <ChatSidebar
            rooms={rooms}
            isLoading={roomsLoading}
            selectedRoomId={selectedRoomId}
            onSelectRoom={handleSelectRoom}
            onCreateRoom={() => setDialogOpen(true)}
          />
        ) : (
          <ChatMessageArea
            room={selectedRoom}
            messages={messages}
            isLoading={messagesLoading}
            currentUserId={user?.id}
            message={message}
            onMessageChange={setMessage}
            onSend={handleSend}
            isSending={sendMessage.isPending}
            onBack={handleBack}
            showBackButton
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
          />
        )}
      </div>

      {/* Create Room Dialog */}
      <CreateRoomDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreateRoom={handleCreateRoom}
        isPending={createRoom.isPending}
      />
    </div>
  );
};

export default Chat;
