import { CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToggleConfirmation, type ChatConfirmation } from '@/hooks/useChatConfirmations';

interface Props {
  messageId: string;
  confirmations: ChatConfirmation[];
  currentUserId?: string;
  confirmerNames?: Record<string, string>;
}

const ConfirmationCard = ({ messageId, confirmations, currentUserId, confirmerNames }: Props) => {
  const toggle = useToggleConfirmation();
  const mine = confirmations.find((c) => c.user_id === currentUserId);

  return (
    <div className="mt-2 rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-primary">
        <CheckCircle2 className="w-3.5 h-3.5" />
        확인 요청
      </div>
      <Button
        variant={mine ? 'default' : 'outline'}
        size="sm"
        className="h-8"
        onClick={() => toggle.mutate({ messageId })}
      >
        {mine ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            확인 완료
          </>
        ) : (
          <>
            <Circle className="w-3.5 h-3.5 mr-1" />
            확인했습니다
          </>
        )}
      </Button>
      {confirmations.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {confirmations.map((c) => (
            <span
              key={c.id}
              className="text-[11px] px-2 py-0.5 rounded-full bg-background border border-border text-muted-foreground"
            >
              {confirmerNames?.[c.user_id] ?? '확인'} 확인
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConfirmationCard;
