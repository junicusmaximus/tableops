import { Calendar, Plane, Package, Megaphone, ClipboardCheck, ShoppingCart } from 'lucide-react';

const CARD_CONFIG: Record<
  string,
  { icon: React.ElementType; label: string; color: string }
> = {
  schedule: { icon: Calendar, label: '스케줄', color: 'text-primary' },
  leave: { icon: Plane, label: '휴가 신청', color: 'text-warning' },
  inventory: { icon: Package, label: '재고 알림', color: 'text-warning' },
  purchase: { icon: ShoppingCart, label: '발주', color: 'text-primary' },
  checklist: { icon: ClipboardCheck, label: '체크리스트', color: 'text-primary' },
  announce: { icon: Megaphone, label: '공지', color: 'text-destructive' },
};

interface Props {
  cardType: string;
  metadata: Record<string, unknown>;
}

const OperationalCard = ({ cardType, metadata }: Props) => {
  const cfg = CARD_CONFIG[cardType] ?? { icon: Megaphone, label: '알림', color: 'text-primary' };
  const Icon = cfg.icon;
  const title = (metadata?.title as string) ?? cfg.label;
  const description = (metadata?.description as string) ?? '';
  const fields = (metadata?.fields as Record<string, string> | undefined) ?? {};

  return (
    <div className="mt-2 rounded-lg border border-border bg-card p-3 space-y-2 max-w-md">
      <div className={`flex items-center gap-2 text-xs font-semibold ${cfg.color}`}>
        <Icon className="w-4 h-4" />
        <span>{cfg.label}</span>
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {Object.keys(fields).length > 0 && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1 border-t border-border">
          {Object.entries(fields).map(([k, v]) => (
            <div key={k} className="text-[11px]">
              <span className="text-muted-foreground">{k}:</span>{' '}
              <span className="text-foreground">{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export { CARD_CONFIG };
export default OperationalCard;
