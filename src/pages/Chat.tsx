import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Paperclip, Pin, Hash, Users, ChefHat } from 'lucide-react';

const demoChatRooms = [
  { id: 1, name: '강남본점 전체', icon: Users, unread: 3, lastMessage: '오늘 마감 체크리스트 완료 부탁드립니다', time: '10:32' },
  { id: 2, name: '주방팀', icon: ChefHat, unread: 1, lastMessage: '닭가슴살 재고 확인 완료', time: '10:15' },
  { id: 3, name: '오픈팀 (3/2)', icon: Hash, unread: 0, lastMessage: '오픈 준비 시작합니다', time: '08:55' },
  { id: 4, name: '공지채널', icon: Pin, unread: 2, lastMessage: '[공지] 3월 신메뉴 교육 일정', time: '어제' },
];

const demoMessages = [
  { id: 1, sender: '김민수', content: '오늘 오픈 준비 시작합니다. 홀 테이블 세팅 부탁드려요.', time: '08:55', isMine: false },
  { id: 2, sender: '이지은', content: '주방 프렙 시작했습니다. 오늘 예약 4팀이라 미리 준비하겠습니다.', time: '09:00', isMine: false },
  { id: 3, sender: '나', content: '네, 알겠습니다! 홀 세팅 시작할게요.', time: '09:05', isMine: true },
  { id: 4, sender: '시스템', content: '📋 오픈 체크리스트가 시작되었습니다.', time: '09:00', isSystem: true },
  { id: 5, sender: '김민수', content: '14시에 VIP 고객 방문 예정입니다. 2번 테이블 준비해주세요.', time: '09:30', isMine: false },
  { id: 6, sender: '시스템', content: '🚛 농협유통 식재료 입고가 10:00에 예정되어 있습니다.', time: '09:45', isSystem: true },
  { id: 7, sender: '나', content: '입고 확인 준비하겠습니다.', time: '09:50', isMine: true },
];

const Chat = () => {
  const [selectedRoom, setSelectedRoom] = useState(1);
  const [message, setMessage] = useState('');

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">채팅</h1>
      </div>

      <div className="grid lg:grid-cols-[300px_1fr] gap-4 h-[calc(100vh-12rem)]">
        {/* Chat Room List */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">채팅방</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {demoChatRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room.id)}
                  className={`w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors ${
                    selectedRoom === room.id ? 'bg-muted' : ''
                  }`}
                >
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <room.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{room.name}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{room.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{room.lastMessage}</p>
                  </div>
                  {room.unread > 0 && (
                    <span className="shrink-0 w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
                      {room.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat Messages */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base">
              {demoChatRooms.find(r => r.id === selectedRoom)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {demoMessages.map((msg) => {
              if ((msg as any).isSystem) {
                return (
                  <div key={msg.id} className="text-center">
                    <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      {msg.content}
                    </span>
                  </div>
                );
              }
              return (
                <div key={msg.id} className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${msg.isMine ? 'order-1' : ''}`}>
                    {!msg.isMine && (
                      <p className="text-xs text-muted-foreground mb-1 ml-1">{msg.sender}</p>
                    )}
                    <div className={`flex items-end gap-1 ${msg.isMine ? 'flex-row-reverse' : ''}`}>
                      <div className={`px-3 py-2 rounded-2xl text-sm ${
                        msg.isMine
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      }`}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{msg.time}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
          <div className="p-3 border-t border-border">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="shrink-0">
                <Paperclip className="w-4 h-4" />
              </Button>
              <Input
                placeholder="메시지를 입력하세요..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1"
              />
              <Button size="icon" className="shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Chat;
