import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useChatRooms,
  useChatMessages,
  useSendMessage,
  useMarkAsRead,
  useCreateChatRoom,
  useCreateDM,
  useUploadChatFile,
  parseMentions,
} from '@/hooks/useChat';
import { useEmployeeProfile, useStoreEmployees } from '@/hooks/useEmployeeProfile';
import { useIsManager } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import ChatWorkspace from '@/components/chat/ChatWorkspace';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatMessageArea from '@/components/chat/ChatMessageArea';
import CreateRoomDialog from '@/components/chat/CreateRoomDialog';
import NewDMDialog from '@/components/chat/NewDMDialog';

const Chat = () => {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const { data: storeEmployees = [] } = useStoreEmployees(profile?.store_id);
  const isManager = useIsManager();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dmDialogOpen, setDmDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  const { data: rooms = [], isLoading: roomsLoading } = useChatRooms();
  const { data: messages = [], isLoading: messagesLoading } = useChatMessages(selectedRoomId);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();
  const createRoom = useCreateChatRoom();
  const createDM = useCreateDM();
  const uploadFile = useUploadChatFile();

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  // Members for @mention
  const members = storeEmployees.map((e) => ({
    user_id: e.user_id,
    full_name: e.full_name,
    profile_image_url: e.profile_image_url,
    position: e.position,
  }));

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

  const handleSend = (
    mentionedUserIds?: string[],
    options?: { messageType?: string; metadata?: Record<string, unknown>; content?: string },
  ) => {
    const content = options?.content ?? message;
    if (!content.trim() || !selectedRoomId) return;

    const contentMentions = parseMentions(content, members);
    const allMentions = [...new Set([...(mentionedUserIds ?? []), ...contentMentions])];

    sendMessage.mutate(
      {
        roomId: selectedRoomId,
        content: content.trim(),
        mentionedUserIds: allMentions.length > 0 ? allMentions : undefined,
        messageType: options?.messageType,
        metadata: options?.metadata,
      },
      {
        onSuccess: () => {
          if (!options?.content) setMessage('');
        },
        onError: () => toast.error('메시지 전송에 실패했습니다'),
      }
    );
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedRoomId) return;

    try {
      const result = await uploadFile.mutateAsync(file);
      sendMessage.mutate(
        {
          roomId: selectedRoomId,
          content: `📎 ${file.name}`,
          fileUrl: result.url,
          fileName: result.name,
          fileType: result.type,
        },
        {
          onSuccess: () => toast.success('파일이 전송되었습니다'),
          onError: () => toast.error('파일 전송에 실패했습니다'),
        }
      );
    } catch {
      toast.error('파일 업로드에 실패했습니다');
    }
  };

  const handleStartDM = (otherUserId: string, otherName: string) => {
    createDM.mutate(
      { otherUserId, otherName },
      {
        onSuccess: (room: any) => {
          setSelectedRoomId(room.id);
          setDmDialogOpen(false);
          setMobileView('chat');
        },
        onError: () => toast.error('대화를 시작할 수 없습니다'),
      },
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

  const messageAreaProps = {
    room: selectedRoom,
    messages,
    isLoading: messagesLoading,
    currentUserId: user?.id,
    message,
    onMessageChange: setMessage,
    onSend: handleSend,
    isSending: sendMessage.isPending,
    searchQuery,
    onSearchQueryChange: setSearchQuery,
    members,
    canPin: isManager,
    onFileUpload: handleFileUpload,
    isUploading: uploadFile.isPending,
  };

  return (
    <div className="animate-fade-in h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] -mx-4 lg:-mx-6 -mt-4 lg:-mt-6">
      {/* Desktop Layout: 3-column */}
      <div className="hidden lg:flex h-full border border-border rounded-xl overflow-hidden shadow-sm">
        <ChatWorkspace profile={profile} storeName={profile?.full_name} />
        <div className="w-[260px] shrink-0">
          <ChatSidebar
            rooms={rooms}
            isLoading={roomsLoading}
            selectedRoomId={selectedRoomId}
            onSelectRoom={handleSelectRoom}
            onCreateRoom={() => setDialogOpen(true)}
          />
        </div>
        <div className="flex-1">
          <ChatMessageArea {...messageAreaProps} />
        </div>
      </div>

      {/* Mobile Layout */}
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
          <ChatMessageArea {...messageAreaProps} onBack={handleBack} showBackButton />
        )}
      </div>

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
