import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useMyConsents, useUpdateConsent } from '@/hooks/useConsents';
import { CONSENT_DEFS, OPTIONAL_WITHDRAWABLE, type ConsentDef } from '@/lib/consents';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const ConsentSettings = () => {
  const { data: rows, isLoading } = useMyConsents();
  const update = useUpdateConsent();
  const [openItem, setOpenItem] = useState<ConsentDef | null>(null);
  const [restrictWarn, setRestrictWarn] = useState(false);
  const { toast } = useToast();

  const findRow = (type: string) => rows?.find((r) => r.consent_type === type);

  const handleToggle = (def: ConsentDef, next: boolean) => {
    if (def.required && !next) {
      setRestrictWarn(true);
      return;
    }
    if (!def.required && !OPTIONAL_WITHDRAWABLE.includes(def.type) && !next) {
      setRestrictWarn(true);
      return;
    }
    update.mutate(
      { consent_type: def.type, consent_version: def.version, accepted: next },
      {
        onSuccess: () =>
          toast({ title: next ? '동의가 저장되었습니다.' : '동의가 철회되었습니다.' }),
        onError: (e: any) =>
          toast({ title: '오류', description: e.message, variant: 'destructive' }),
      }
    );
  };

  return (
    <div className="space-y-4 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-2">
        <Link to="/settings" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">동의 내역 관리</h1>
          <p className="text-muted-foreground text-sm">약관 및 개인정보 동의 상태를 관리합니다.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            동의 항목
          </CardTitle>
          <CardDescription>버전과 동의 시각이 함께 기록됩니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && <p className="text-xs text-muted-foreground">불러오는 중...</p>}
          {CONSENT_DEFS.map((def) => {
            const row = findRow(def.type);
            const accepted = !!row?.accepted;
            const canWithdraw =
              def.required ? false : OPTIONAL_WITHDRAWABLE.includes(def.type);
            return (
              <div
                key={def.type}
                className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant={def.required ? 'destructive' : 'secondary'}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {def.required ? '필수' : '선택'}
                    </Badge>
                    <p className="text-sm font-medium truncate">{def.title}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{def.shortLabel}</p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>버전 {row?.consent_version ?? def.version}</span>
                    {row?.accepted_at && (
                      <span>· 동의일 {format(new Date(row.accepted_at), 'yyyy-MM-dd HH:mm')}</span>
                    )}
                    {row?.withdrawn_at && !accepted && (
                      <span>· 철회 {format(new Date(row.withdrawn_at), 'yyyy-MM-dd HH:mm')}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenItem(def)}
                    className="mt-1 text-[11px] text-primary hover:underline"
                  >
                    자세히 보기
                  </button>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Switch
                    checked={accepted}
                    onCheckedChange={(v) => handleToggle(def, v)}
                    disabled={update.isPending}
                  />
                  {!canWithdraw && accepted && (
                    <span className="text-[10px] text-muted-foreground">철회 제한</span>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={!!openItem} onOpenChange={(o) => !o && setOpenItem(null)}>
        <DialogContent className="max-w-md max-h-[80vh]">
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

      <Dialog open={restrictWarn} onOpenChange={setRestrictWarn}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-destructive" />
              철회 제한
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            필수 동의 철회 시 서비스 이용이 제한될 수 있습니다. 관리자에게 문의해주세요.
          </p>
          <Button onClick={() => setRestrictWarn(false)} className="w-full">
            확인
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConsentSettings;
