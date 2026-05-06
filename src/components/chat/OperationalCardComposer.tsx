import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles } from 'lucide-react';
import { CARD_CONFIG } from './OperationalCard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Props {
  onSend: (cardType: string, metadata: Record<string, unknown>) => void;
}

const OperationalCardComposer = ({ onSend }: Props) => {
  const [open, setOpen] = useState(false);
  const [cardType, setCardType] = useState<string>('schedule');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const submit = () => {
    if (!title.trim()) return;
    onSend(cardType, { title: title.trim(), description: description.trim() });
    setTitle('');
    setDescription('');
    setOpen(false);
  };

  const openWith = (type: string) => {
    setCardType(type);
    setOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            title="운영 카드"
          >
            <Sparkles className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {Object.entries(CARD_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <DropdownMenuItem key={key} onClick={() => openWith(key)}>
                <Icon className={`w-3.5 h-3.5 mr-2 ${cfg.color}`} />
                {cfg.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{CARD_CONFIG[cardType]?.label} 카드 보내기</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">제목</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">설명 (선택)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <Button onClick={submit} disabled={!title.trim()} className="w-full">
              카드 보내기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OperationalCardComposer;
