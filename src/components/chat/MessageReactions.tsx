import { useMemo } from 'react';
import { Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { REACTION_OPTIONS, useToggleReaction, type ChatReaction } from '@/hooks/useChatReactions';

interface Props {
  messageId: string;
  reactions: ChatReaction[];
  currentUserId?: string;
  compact?: boolean;
}

const MessageReactions = ({ messageId, reactions, currentUserId, compact }: Props) => {
  const toggle = useToggleReaction();
  const grouped = useMemo(() => {
    const map = new Map<string, ChatReaction[]>();
    for (const r of reactions) {
      const arr = map.get(r.reaction_type) ?? [];
      arr.push(r);
      map.set(r.reaction_type, arr);
    }
    return Array.from(map.entries());
  }, [reactions]);

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1">
      {grouped.map(([type, list]) => {
        const mine = list.some((r) => r.user_id === currentUserId);
        return (
          <button
            key={type}
            onClick={() => toggle.mutate({ messageId, reactionType: type })}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-xs transition-colors ${
              mine
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border bg-muted/40 text-foreground hover:bg-muted'
            }`}
          >
            <span>{type}</span>
            <span className="text-[10px] font-medium">{list.length}</span>
          </button>
        );
      })}

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
              compact ? '' : ''
            }`}
            aria-label="반응 추가"
          >
            <Smile className="w-3.5 h-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1.5" align="start">
          <div className="flex gap-1">
            {REACTION_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => toggle.mutate({ messageId, reactionType: emoji })}
                className="w-8 h-8 rounded hover:bg-muted text-lg flex items-center justify-center"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MessageReactions;
