import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Hash, Users, Megaphone } from 'lucide-react';

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateRoom: (name: string, type: string) => void;
  isPending: boolean;
}

const ROOM_TYPES = [
  { value: 'channel', label: '채널', icon: Hash, desc: '팀 전체 소통' },
  { value: 'group', label: '그룹 채팅', icon: Users, desc: '소규모 그룹' },
  { value: 'announcement', label: '공지 채널', icon: Megaphone, desc: '공지 전용' },
];

const CreateRoomDialog = ({ open, onOpenChange, onCreateRoom, isPending }: CreateRoomDialogProps) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('channel');

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreateRoom(name.trim(), type);
    setName('');
    setType('channel');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>새 채팅방 만들기</DialogTitle>
          <DialogDescription>팀과 소통할 채팅방을 만들어보세요</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Room type selection */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">채팅방 유형</Label>
            <div className="grid grid-cols-3 gap-2">
              {ROOM_TYPES.map((rt) => {
                const Icon = rt.icon;
                const isSelected = type === rt.value;
                return (
                  <button
                    key={rt.value}
                    onClick={() => setType(rt.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-primary/30 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{rt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Room name */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">채팅방 이름</Label>
            <Input
              placeholder="예: 홀팀, 주방팀, 공지"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>

          <Button onClick={handleCreate} disabled={isPending || !name.trim()} className="w-full">
            {isPending ? '생성 중...' : '채팅방 만들기'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoomDialog;
