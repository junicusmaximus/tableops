import { useEffect, useMemo, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { getConsentsForRole, type ConsentDef, type ConsentType } from '@/lib/consents';

interface Props {
  role: string;
  value: Record<ConsentType, boolean>;
  onChange: (next: Record<ConsentType, boolean>) => void;
}

const ConsentSection = ({ role, value, onChange }: Props) => {
  const items = useMemo(() => getConsentsForRole(role), [role]);
  const [openItem, setOpenItem] = useState<ConsentDef | null>(null);

  // When role changes, drop checkbox state for items no longer in scope.
  useEffect(() => {
    const allowed = new Set(items.map((i) => i.type));
    let changed = false;
    const next = { ...value } as Record<string, boolean>;
    Object.keys(next).forEach((k) => {
      if (!allowed.has(k as ConsentType)) {
        delete next[k];
        changed = true;
      }
    });
    if (changed) onChange(next as Record<ConsentType, boolean>);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const allChecked = items.every((i) => value[i.type]);
  const requiredItems = items.filter((i) => i.required);
  const requiredAllChecked = requiredItems.every((i) => value[i.type]);

  const setAll = (checked: boolean) => {
    const next = { ...value };
    items.forEach((i) => {
      next[i.type] = checked;
    });
    onChange(next);
  };

  const toggle = (t: ConsentType, checked: boolean) => {
    onChange({ ...value, [t]: checked });
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card/50 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">약관 및 개인정보 동의</p>
        {!requiredAllChecked && (
          <Badge variant="outline" className="text-[10px] border-destructive text-destructive">
            필수 항목 확인
          </Badge>
        )}
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox checked={allChecked} onCheckedChange={(v) => setAll(!!v)} />
        <span className="text-sm font-medium">전체 동의</span>
      </label>

      <Separator />

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.type} className="flex items-start justify-between gap-2">
            <label className="flex items-start gap-2 cursor-pointer flex-1 min-w-0">
              <Checkbox
                className="mt-0.5"
                checked={!!value[item.type]}
                onCheckedChange={(v) => toggle(item.type, !!v)}
              />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant={item.required ? 'destructive' : 'secondary'}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {item.required ? '필수' : '선택'}
                  </Badge>
                  <span className="text-xs font-medium truncate">{item.title}</span>
                </div>
                <span className="text-[11px] text-muted-foreground line-clamp-1">
                  {item.shortLabel}
                </span>
              </div>
            </label>
            <button
              type="button"
              onClick={() => setOpenItem(item)}
              className="shrink-0 text-[11px] text-primary hover:underline"
            >
              자세히 보기
            </button>
          </div>
        ))}
      </div>

      <Dialog open={!!openItem} onOpenChange={(o) => !o && setOpenItem(null)}>
        <DialogContent className="max-w-sm max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-sm">{openItem?.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-2">
            <pre className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap font-sans">
              {openItem?.content}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConsentSection;
