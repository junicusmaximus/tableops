import { applySmartVariables, type DocumentSchema, type FieldBlock } from '@/lib/documentTypes';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SignaturePad from './SignaturePad';

interface Props {
  schema: DocumentSchema;
  smartCtx: Record<string, string>;
  values: Record<string, any>;
  onChange?: (fieldId: string, value: any) => void;
  onSignatureChange?: (data: { method: 'draw' | 'typed'; dataUrl?: string; typedName?: string } | null) => void;
  signaturePreview?: { method: 'draw' | 'typed'; dataUrl?: string; typedName?: string } | null;
  readOnly?: boolean;
}

export default function DocumentRenderer({ schema, smartCtx, values, onChange, onSignatureChange, signaturePreview, readOnly }: Props) {
  const renderField = (b: FieldBlock) => {
    const v = values[b.id];
    const setV = (val: any) => onChange?.(b.id, val);
    const def = b.defaultValue ? applySmartVariables(b.defaultValue, smartCtx) : '';

    switch (b.fieldType) {
      case 'text_input':
        return <Input value={v ?? def} disabled={readOnly} onChange={(e) => setV(e.target.value)} placeholder={b.placeholder} />;
      case 'textarea':
        return <Textarea value={v ?? def} disabled={readOnly} onChange={(e) => setV(e.target.value)} placeholder={b.placeholder} />;
      case 'date':
        return <Input type="date" value={v ?? def} disabled={readOnly} onChange={(e) => setV(e.target.value)} />;
      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <Checkbox checked={!!v} disabled={readOnly} onCheckedChange={(c) => setV(!!c)} id={b.id} />
            <Label htmlFor={b.id} className="cursor-pointer">{b.label}</Label>
          </div>
        );
      case 'dropdown':
        return (
          <Select value={v ?? ''} disabled={readOnly} onValueChange={setV}>
            <SelectTrigger><SelectValue placeholder={b.placeholder ?? '선택하세요'} /></SelectTrigger>
            <SelectContent>
              {(b.options ?? []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        );
      case 'signature':
        if (readOnly) {
          if (signaturePreview?.method === 'draw' && signaturePreview.dataUrl) {
            return <img src={signaturePreview.dataUrl} alt="서명" className="h-24 bg-muted/30 rounded border border-border p-2" />;
          }
          if (signaturePreview?.method === 'typed') {
            return <div className="rounded-lg border border-border p-4 text-center"><p className="text-2xl" style={{ fontFamily: 'cursive' }}>{signaturePreview.typedName}</p></div>;
          }
          return <p className="text-sm text-muted-foreground">서명 없음</p>;
        }
        return <SignaturePad onChange={onSignatureChange ?? (() => {})} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {schema.blocks.map((b) => {
        if (b.type === 'heading') {
          const Tag = (`h${b.level ?? 1}`) as keyof JSX.IntrinsicElements;
          const cls = b.level === 1 ? 'text-2xl font-bold' : b.level === 2 ? 'text-xl font-semibold' : 'text-lg font-medium';
          return <Tag key={b.id} className={cls}>{applySmartVariables(b.text, smartCtx)}</Tag>;
        }
        if (b.type === 'paragraph') {
          return <p key={b.id} className="text-sm leading-relaxed whitespace-pre-wrap">{applySmartVariables(b.text, smartCtx)}</p>;
        }
        if (b.type === 'divider') {
          return <hr key={b.id} className="border-border" />;
        }
        if (b.type !== 'field') return null;
        return (
          <div key={b.id} className="space-y-1.5">
            {b.fieldType !== 'checkbox' && (
              <Label>
                {b.label}
                {b.required && <span className="text-destructive ml-1">*</span>}
              </Label>
            )}
            {renderField(b)}
            {b.helperText && <p className="text-xs text-muted-foreground">{b.helperText}</p>}
          </div>
        );
      })}
    </div>
  );
}

// Render to plain HTML string for final document storage
export function renderToHtml(schema: DocumentSchema, smartCtx: Record<string, string>, values: Record<string, any>, signature: { method: string; dataUrl?: string; typedName?: string } | null): string {
  const parts: string[] = ['<div style="font-family: sans-serif; padding: 20px;">'];
  for (const b of schema.blocks) {
    if (b.type === 'heading') {
      const tag = `h${b.level ?? 1}`;
      parts.push(`<${tag}>${escapeHtml(applySmartVariables(b.text, smartCtx))}</${tag}>`);
    } else if (b.type === 'paragraph') {
      parts.push(`<p>${escapeHtml(applySmartVariables(b.text, smartCtx))}</p>`);
    } else if (b.type === 'divider') {
      parts.push('<hr/>');
    } else {
      const v = values[b.id];
      if (b.fieldType === 'signature') {
        if (signature?.method === 'draw' && signature.dataUrl) {
          parts.push(`<div><strong>${escapeHtml(b.label)}:</strong><br/><img src="${signature.dataUrl}" style="max-height: 100px;"/></div>`);
        } else if (signature?.method === 'typed') {
          parts.push(`<div><strong>${escapeHtml(b.label)}:</strong> <em style="font-family: cursive; font-size: 1.5em;">${escapeHtml(signature.typedName ?? '')}</em></div>`);
        }
      } else if (b.fieldType === 'checkbox') {
        parts.push(`<div>[${v ? '✓' : ' '}] ${escapeHtml(b.label)}</div>`);
      } else {
        parts.push(`<div><strong>${escapeHtml(b.label)}:</strong> ${escapeHtml(String(v ?? ''))}</div>`);
      }
    }
  }
  parts.push('</div>');
  return parts.join('\n');
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
