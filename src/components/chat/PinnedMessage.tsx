import { Pin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ChatMessage } from '@/hooks/useChat';

interface PinnedMessageProps {
  message: ChatMessage | undefined;
  onUnpin: () => void;
  canUnpin: boolean;
}

const PinnedMessage = ({ message, onUnpin, canUnpin }: PinnedMessageProps) => {
  if (!message) return null;

  return (
    <div className="px-4 py-2 border-b border-border bg-warning/5 flex items-start gap-2.5">
      <Pin className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-warning">📢 고정된 메시지</p>
        <p className="text-xs text-foreground truncate mt-0.5">{message.content}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">— {message.sender_name}</p>
      </div>
      {canUnpin && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={onUnpin}
        >
          <X className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
};

export default PinnedMessage;
