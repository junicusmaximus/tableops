import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import {
  SYSTEM_VARIABLES,
  VARIABLE_CATEGORIES,
  SOURCE_LABELS,
  EDITABLE_BY_LABELS,
  INPUT_TYPE_LABELS,
  type SmartVariableConfig,
  type SourceType,
  type InputType,
  type EditableBy,
} from '@/lib/smartVariables';

interface Props {
  variables: SmartVariableConfig[];
  onChange: (next: SmartVariableConfig[]) => void;
  usedKeys?: Set<string>; // keys actually used in body — highlighted
}

const SOURCES: SourceType[] = ['auto_company', 'auto_store', 'auto_employee', 'manual_sender', 'manual_recipient', 'signed_at_auto', 'document_meta', 'default', 'custom'];
const INPUTS: InputType[] = ['text', 'long_text', 'number', 'date', 'time', 'checkbox', 'dropdown'];
const EDITABLES: EditableBy[] = ['auto', 'sender', 'recipient', 'both'];

export default function SmartVariableConfig({ variables, onChange, usedKeys }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [newCustom, setNewCustom] = useState({ key: '', display: '' });

  const cfgMap = useMemo(() => new Map(variables.map((v) => [v.variable_key, v])), [variables]);

  const toggleSystem = (sv: SmartVariableConfig, on: boolean) => {
    if (on) onChange([...variables, sv]);
    else onChange(variables.filter((v) => v.variable_key !== sv.variable_key));
  };

  const updateVar = (key: string, patch: Partial<SmartVariableConfig>) => {
    onChange(variables.map((v) => (v.variable_key === key ? { ...v, ...patch } : v)));
  };

  const removeVar = (key: string) => onChange(variables.filter((v) => v.variable_key !== key));

  const addCustom = () => {
    const raw = newCustom.key.trim().replace(/^\{\{|\}\}$/g, '');
    const display = newCustom.display.trim() || raw;
    if (!raw) return;
    const key = `{{${raw}}}`;
    if (cfgMap.has(key)) return;
    const v: SmartVariableConfig = {
      variable_key: key,
      display_name: display,
      source_type: 'manual_sender',
      input_type: 'text',
      required: false,
      editable_by: 'sender',
      allow_manual_override: true,
      is_custom: true,
      category: '커스텀 변수',
    };
    onChange([...variables, v]);
    setNewCustom({ key: '', display: '' });
  };

  const renderVarRow = (sv: SmartVariableConfig) => {
    const cfg = cfgMap.get(sv.variable_key);
    const isOn = !!cfg;
    const isExp = !!expanded[sv.variable_key];
    const isUsed = usedKeys?.has(sv.variable_key);
    return (
      <div key={sv.variable_key} className="border rounded-md p-2.5 space-y-2 bg-card/40">
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={() => setExpanded({ ...expanded, [sv.variable_key]: !isExp })} className="flex items-center gap-2 text-left flex-1 min-w-0">
            {isOn ? (isExp ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />) : <span className="w-3.5" />}
            <span className="font-medium text-sm truncate">{sv.display_name}</span>
            <code className="text-[11px] text-muted-foreground truncate">{sv.variable_key}</code>
            {isUsed && <Badge variant="outline" className="text-[10px]">본문 사용중</Badge>}
            {isOn && cfg?.required && <Badge variant="destructive" className="text-[10px]">필수</Badge>}
          </button>
          {!sv.is_custom ? (
            <Switch checked={isOn} onCheckedChange={(c) => toggleSystem(sv, c)} />
          ) : (
            <Button size="sm" variant="ghost" onClick={() => removeVar(sv.variable_key)}><Trash2 className="w-3.5 h-3.5" /></Button>
          )}
        </div>

        {isOn && isExp && cfg && (
          <div className="grid gap-2 sm:grid-cols-2 pt-1 pl-5 border-l-2 border-primary/20 ml-1.5">
            <div>
              <Label className="text-xs">표시명</Label>
              <Input value={cfg.display_name} onChange={(e) => updateVar(cfg.variable_key, { display_name: e.target.value })} className="h-8" />
            </div>
            <div>
              <Label className="text-xs">데이터 출처</Label>
              <Select value={cfg.source_type} onValueChange={(v) => updateVar(cfg.variable_key, { source_type: v as SourceType })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>{SOURCES.map((s) => <SelectItem key={s} value={s}>{SOURCE_LABELS[s]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">입력 타입</Label>
              <Select value={cfg.input_type} onValueChange={(v) => updateVar(cfg.variable_key, { input_type: v as InputType })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>{INPUTS.map((s) => <SelectItem key={s} value={s}>{INPUT_TYPE_LABELS[s]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">입력 권한</Label>
              <Select value={cfg.editable_by} onValueChange={(v) => updateVar(cfg.variable_key, { editable_by: v as EditableBy })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>{EDITABLES.map((s) => <SelectItem key={s} value={s}>{EDITABLE_BY_LABELS[s]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">기본값</Label>
              <Input value={cfg.default_value ?? ''} onChange={(e) => updateVar(cfg.variable_key, { default_value: e.target.value })} className="h-8" placeholder="값이 없을 때 사용할 기본값" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">설명</Label>
              <Textarea value={cfg.description ?? ''} onChange={(e) => updateVar(cfg.variable_key, { description: e.target.value })} rows={2} />
            </div>
            <div className="flex items-center gap-2"><Switch checked={cfg.required} onCheckedChange={(c) => updateVar(cfg.variable_key, { required: c })} /><Label className="text-xs">필수</Label></div>
            <div className="flex items-center gap-2"><Switch checked={cfg.allow_manual_override} onCheckedChange={(c) => updateVar(cfg.variable_key, { allow_manual_override: c })} /><Label className="text-xs">수동 입력 허용</Label></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {VARIABLE_CATEGORIES.filter((c) => c !== '커스텀 변수').map((cat) => {
        const sysVars = SYSTEM_VARIABLES.filter((v) => v.category === cat);
        if (sysVars.length === 0) return null;
        return (
          <Card key={cat}>
            <CardContent className="p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">{cat}</p>
              <div className="space-y-1.5">{sysVars.map(renderVarRow)}</div>
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardContent className="p-3 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground">커스텀 변수</p>
          <div className="space-y-1.5">{variables.filter((v) => v.is_custom).map(renderVarRow)}</div>
          <div className="flex gap-2 items-end pt-2 border-t border-dashed">
            <div className="flex-1">
              <Label className="text-xs">변수 키 (예: 수습기간)</Label>
              <Input value={newCustom.key} onChange={(e) => setNewCustom({ ...newCustom, key: e.target.value })} className="h-8" placeholder="수습기간" />
            </div>
            <div className="flex-1">
              <Label className="text-xs">표시명</Label>
              <Input value={newCustom.display} onChange={(e) => setNewCustom({ ...newCustom, display: e.target.value })} className="h-8" placeholder="수습기간" />
            </div>
            <Button size="sm" onClick={addCustom}><Plus className="w-4 h-4 mr-1" />커스텀 변수 추가</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
