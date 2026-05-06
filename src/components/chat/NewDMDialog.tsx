import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface DMMember {
  user_id: string | null;
  full_name: string;
  profile_image_url?: string | null;
  position?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  members: DMMember[];
  onSelect: (member: DMMember) => void;
  isPending?: boolean;
}

const NewDMDialog = ({ open, onOpenChange, members, onSelect, isPending }: Props) => {
  const [search, setSearch] = useState('');
  const filtered = useMemo(
    () =>
      members.filter(
        (m) => m.user_id && m.full_name.toLowerCase().includes(search.toLowerCase()),
      ),
    [members, search],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> 1:1 대화 시작
          </DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="이름 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
            autoFocus
          />
        </div>
        <ScrollArea className="max-h-[320px]">
          <div className="space-y-1">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">동료가 없습니다</p>
            ) : (
              filtered.map((m) => (
                <button
                  key={m.user_id}
                  onClick={() => onSelect(m)}
                  disabled={isPending}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted text-left disabled:opacity-50"
                >
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={m.profile_image_url ?? undefined} className="object-cover" />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {m.full_name.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{m.full_name}</p>
                    {m.position && (
                      <p className="text-[11px] text-muted-foreground truncate">{m.position}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default NewDMDialog;
