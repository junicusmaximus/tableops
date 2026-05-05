import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Bell, BellRing } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface DocExpiryRule {
  enabled: boolean;
  offsets: number[]; // days before expiry
}

export type DocExpiryConfig = Record<string, DocExpiryRule>;

const STORAGE_KEY = 'doc_expiry_alert_config_v1';
const DEFAULT_TYPES = ['근로계약서', '보건증', '교육이수증'];

const DEFAULT_CONFIG: DocExpiryConfig = DEFAULT_TYPES.reduce((acc, t) => {
  acc[t] = { enabled: true, offsets: [30, 7] };
  return acc;
}, {} as DocExpiryConfig);

export const loadExpiryConfig = (): DocExpiryConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
};

const saveExpiryConfig = (cfg: DocExpiryConfig) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  window.dispatchEvent(new CustomEvent('doc-expiry-config-changed'));
};

export const useExpiryConfig = (): DocExpiryConfig => {
  const [cfg, setCfg] = useState<DocExpiryConfig>(loadExpiryConfig);
  useEffect(() => {
    const handler = () => setCfg(loadExpiryConfig());
    window.addEventListener('doc-expiry-config-changed', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('doc-expiry-config-changed', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);
  return cfg;
};

const DocumentExpirySettings = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<DocExpiryConfig>(loadExpiryConfig);

  useEffect(() => {
    if (open) setConfig(loadExpiryConfig());
  }, [open]);

  const updateRule = (type: string, patch: Partial<DocExpiryRule>) => {
    setConfig(prev => ({ ...prev, [type]: { ...prev[type], ...patch } }));
  };

  const toggleOffset = (type: string, days: number) => {
    setConfig(prev => {
      const current = prev[type]?.offsets ?? [];
      const next = current.includes(days) ? current.filter(d => d !== days) : [...current, days].sort((a, b) => b - a);
      return { ...prev, [type]: { ...prev[type], offsets: next } };
    });
  };

  const handleSave = () => {
    saveExpiryConfig(config);
    setOpen(false);
    toast({ title: '저장 완료', description: '서류 만기 알림 설정이 저장되었습니다.' });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <BellRing className="w-4 h-4 mr-2" />만기 알림 설정
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>서류 만기 알림 설정</DialogTitle>
          <DialogDescription>
            서류 유형별로 만기 며칠 전에 알림을 받을지 설정합니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {DEFAULT_TYPES.map((type, idx) => {
            const rule = config[type] ?? { enabled: true, offsets: [30, 7] };
            return (
              <div key={type}>
                {idx > 0 && <Separator className="mb-4" />}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{type}</span>
                  </div>
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(v) => updateRule(type, { enabled: v })}
                  />
                </div>
                <div className="space-y-2 pl-6">
                  <Label className="text-xs text-muted-foreground">알림 시점 (만기 전 일수)</Label>
                  <div className="flex gap-2 flex-wrap">
                    {[30, 14, 7, 3, 1].map(d => (
                      <Button
                        key={d}
                        type="button"
                        size="sm"
                        variant={rule.offsets.includes(d) ? 'default' : 'outline'}
                        disabled={!rule.enabled}
                        onClick={() => toggleOffset(type, d)}
                      >
                        D-{d}
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">사용자 지정 추가</Label>
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      placeholder="일"
                      className="h-8 w-20"
                      disabled={!rule.enabled}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const v = parseInt((e.target as HTMLInputElement).value);
                          if (v > 0) {
                            toggleOffset(type, v);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          <Button className="w-full" onClick={handleSave}>저장</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentExpirySettings;
