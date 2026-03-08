import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { ReadByUser } from '@/hooks/useChat';

interface ReadReceiptPopoverProps {
  readCount: number;
  readBy: ReadByUser[];
}

const ReadReceiptPopover = ({ readCount, readBy }: ReadReceiptPopoverProps) => {
  if (readCount === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 mt-0.5 cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 transition-colors">
          <CheckCheck className="w-3 h-3 text-primary" />
          <span className="text-[10px] text-muted-foreground">읽음 {readCount}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start" side="top">
        <p className="text-xs font-semibold text-foreground mb-2 px-1">읽은 사람 ({readCount})</p>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {readBy.map((reader) => (
            <div key={reader.user_id} className="flex items-center gap-2 px-1 py-1.5 rounded hover:bg-muted/50">
              <Avatar className="w-6 h-6">
                <AvatarImage src={reader.profile_image_url ?? undefined} className="object-cover" />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {reader.full_name.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{reader.full_name}</p>
                {reader.position && (
                  <p className="text-[10px] text-muted-foreground truncate">{reader.position}</p>
                )}
              </div>
              <span className="text-[9px] text-muted-foreground shrink-0">
                {format(new Date(reader.read_at), 'HH:mm', { locale: ko })}
              </span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ReadReceiptPopover;
