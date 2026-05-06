import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, AlertTriangle } from 'lucide-react';
import { VARIABLE_CATEGORIES, SYSTEM_VARIABLES, type SmartVariableConfig } from '@/lib/smartVariables';

interface Props {
  configured: SmartVariableConfig[];
  onInsert: (key: string) => void;
  usedKeys: Set<string>;
}

export default function SmartVariablePanel({ configured, onInsert, usedKeys }: Props) {
  const [q, setQ] = useState('');
  const cfgKeys = useMemo(() => new Set(configured.map((c) => c.variable_key)), [configured]);

  const allByCategory = useMemo(() => {
    const map = new Map<string, SmartVariableConfig[]>();
    for (const c of VARIABLE_CATEGORIES) map.set(c, []);
    for (const v of SYSTEM_VARIABLES) map.get(v.category)?.push(v);
    for (const v of configured.filter((c) => c.is_custom)) map.get('커스텀 변수')?.push(v);
    return map;
  }, [configured]);

  const filter = (v: SmartVariableConfig) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return v.display_name.toLowerCase().includes(s) || v.variable_key.toLowerCase().includes(s);
  };

  const unconfiguredUsed = Array.from(usedKeys).filter((k) => !cfgKeys.has(k));

  return (
    <Card className="sticky top-2">
      <CardContent className="p-3 space-y-3 max-h-[80vh] overflow-y-auto">
        <p className="text-xs font-semibold text-muted-foreground">스마트변수</p>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색" className="h-8 pl-7 text-xs" />
        </div>

        {unconfiguredUsed.length > 0 && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 space-y-1">
            <p className="text-[11px] font-medium text-destructive flex items-center gap-1"><AlertTriangle className="w-3 h-3" />설정되지 않은 변수</p>
            {unconfiguredUsed.map((k) => (
              <code key={k} className="block text-[11px] text-destructive">{k}</code>
            ))}
          </div>
        )}

        {VARIABLE_CATEGORIES.map((cat) => {
          const items = (allByCategory.get(cat) ?? []).filter(filter);
          if (items.length === 0) return null;
          return (
            <div key={cat} className="space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground">{cat}</p>
              <div className="space-y-0.5">
                {items.map((v) => {
                  const isCfg = cfgKeys.has(v.variable_key);
                  const isUsed = usedKeys.has(v.variable_key);
                  return (
                    <Button
                      key={v.variable_key}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onInsert(v.variable_key)}
                      className="w-full justify-between h-auto py-1.5 px-2 text-left"
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs truncate">{v.display_name}</span>
                        {!isCfg && <Badge variant="outline" className="text-[9px] h-4 border-amber-500/50 text-amber-500">미설정</Badge>}
                        {isUsed && <Badge variant="outline" className="text-[9px] h-4">사용중</Badge>}
                      </span>
                      <code className="text-[10px] text-muted-foreground truncate">{v.variable_key}</code>
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
