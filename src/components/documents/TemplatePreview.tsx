import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { Eye, Users, FileWarning } from 'lucide-react';
import DocumentRenderer from './DocumentRenderer';
import {
  buildSampleContext,
  extractVariableKeys,
  type SmartVariableConfig,
} from '@/lib/smartVariables';
import type { DocumentSchema } from '@/lib/documentTypes';

interface Props {
  schema: DocumentSchema;
  variables: SmartVariableConfig[];
  title: string;
}

export default function TemplatePreview({ schema, variables, title }: Props) {
  const [mode, setMode] = useState<'sample' | 'empty'>('sample');

  const ctx = mode === 'sample' ? buildSampleContext(variables) : {};

  const usedKeys = new Set<string>();
  for (const b of schema.blocks) {
    if (b.type === 'heading' || b.type === 'paragraph') {
      extractVariableKeys(b.text).forEach((k) => usedKeys.add(k));
    }
  }
  const cfgKeys = new Set(variables.map((v) => v.variable_key));
  const unresolved = Array.from(usedKeys).filter((k) => !cfgKeys.has(k) || (mode === 'empty' && !ctx[k]));

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">미리보기 모드</span>
          </div>
          <Select value={mode} onValueChange={(v) => setMode(v as any)}>
            <SelectTrigger className="w-[200px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sample"><Users className="w-3.5 h-3.5 inline mr-1" />샘플 데이터로 미리보기</SelectItem>
              <SelectItem value="empty"><FileWarning className="w-3.5 h-3.5 inline mr-1" />빈 값 표시하기</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {unresolved.length > 0 && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
          <p className="font-medium text-amber-600 dark:text-amber-400 mb-1">미해결 변수 ({unresolved.length}개)</p>
          <div className="flex flex-wrap gap-1">
            {unresolved.map((k) => <code key={k} className="px-1.5 py-0.5 bg-background rounded">{k}</code>)}
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-6 bg-background">
          <DocumentRenderer schema={schema} smartCtx={ctx} values={{}} readOnly />
        </CardContent>
      </Card>
    </div>
  );
}
