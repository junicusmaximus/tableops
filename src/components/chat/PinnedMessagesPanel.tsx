import { Pin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import type { PinnedMessageRecord } from '@/hooks/useChatPinnedMessages';

interface Props {
  pins: PinnedMessageRecord[];
  canUnpin: boolean;
  onUnpin: (messageId: string) => void;
}

const PinnedMessagesPanel = ({ pins, canUnpin, onUnpin }: Props) => {
  const [expanded, setExpanded] = useState(false);
  if (!pins.length) return null;
  const visible = expanded ? pins : pins.slice(0, 1);

  return (
    <div className="px-4 py-2 border-b border-border bg-warning/5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] font-semibold text-warning flex items-center gap-1">
          <Pin className="w-3 h-3" /> 고정 {pins.length}개
        </p>
        {pins.length > 1 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            {expanded ? '접기' : '모두 보기'}
          </button>
        )}
      </div>
      <div className="space-y-1">
        {visible.map((p) => (
          <div key={p.id} className="flex items-start gap-2 group">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground truncate">{p.message?.content ?? '(삭제된 메시지)'}</p>
              <p className="text-[10px] text-muted-foreground">— {p.message?.sender_name}</p>
            </div>
            {canUnpin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0"
                onClick={() => onUnpin(p.message_id)}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PinnedMessagesPanel;
