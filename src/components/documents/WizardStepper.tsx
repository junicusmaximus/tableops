import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  label: string;
}

interface Props {
  steps: Step[];
  current: number;
  onStepClick?: (i: number) => void;
}

export default function WizardStepper({ steps, current, onStepClick }: Props) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onStepClick?.(i)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                active && 'bg-primary text-primary-foreground',
                done && 'bg-primary/20 text-primary',
                !active && !done && 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              <span
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[10px]',
                  active ? 'bg-primary-foreground text-primary' : done ? 'bg-primary text-primary-foreground' : 'bg-background',
                )}
              >
                {done ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              {s.label}
            </button>
            {i < steps.length - 1 && <div className="w-4 h-px bg-border" />}
          </div>
        );
      })}
    </div>
  );
}
