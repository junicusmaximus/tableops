import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InventoryItem, useInventoryItems } from '@/hooks/useInventoryItems';
import { useToast } from '@/hooks/use-toast';

interface ItemAutocompleteProps {
  storeId: string | null;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (item: InventoryItem) => void;
  placeholder?: string;
  typeFilter?: 'raw' | 'prep';
  className?: string;
  allowQuickCreate?: boolean;
  /** Use external hook instance to avoid duplicate fetches */
  inventoryHook?: ReturnType<typeof useInventoryItems>;
}

export default function ItemAutocomplete({
  storeId,
  value,
  onChange,
  onSelect,
  placeholder = '품목명, 약어코드, 별칭으로 검색...',
  typeFilter,
  className,
  allowQuickCreate = true,
  inventoryHook,
}: ItemAutocompleteProps) {
  const { toast } = useToast();
  const ownHook = useInventoryItems(inventoryHook ? null : storeId);
  const hook = inventoryHook || ownHook;
  const { searchItems, recordUsage, createItem } = hook;

  const [open, setOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [qcForm, setQcForm] = useState({ item_name: '', short_code: '', english_name: '', aliases: '', category: '기타' });

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = searchItems(value, typeFilter);
  const showDropdown = open && value.trim().length > 0;

  const handleSelect = useCallback((item: InventoryItem) => {
    onChange(item.item_name);
    onSelect?.(item);
    recordUsage(item.id, value);
    setOpen(false);
  }, [onChange, onSelect, recordUsage, value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIdx]) {
        handleSelect(results[selectedIdx]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  useEffect(() => {
    setSelectedIdx(0);
  }, [value]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const el = listRef.current.children[selectedIdx] as HTMLElement;
      el?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [selectedIdx]);

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="bg-primary/20 text-primary font-semibold">{text.slice(idx, idx + query.length)}</span>
        {text.slice(idx + query.length)}
      </>
    );
  };

  const handleQuickCreate = async () => {
    if (!qcForm.item_name || !storeId) return;
    const { data: { user } } = await (await import('@/integrations/supabase/client')).supabase.auth.getUser();
    if (!user) return;

    const result = await createItem({
      store_id: storeId,
      item_name: qcForm.item_name,
      english_name: qcForm.english_name || null,
      short_code: qcForm.short_code || null,
      aliases: qcForm.aliases ? qcForm.aliases.split(',').map(s => s.trim()).filter(Boolean) : [],
      category: qcForm.category,
      item_type: typeFilter || 'raw',
      default_unit: 'kg',
      created_by: user.id,
    });

    if (result) {
      onChange(result.item_name);
      onSelect?.(result);
      setQuickCreateOpen(false);
      setQcForm({ item_name: '', short_code: '', english_name: '', aliases: '', category: '기타' });
    }
  };

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          value={value}
          onChange={e => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-9 pr-8"
        />
        {value && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onMouseDown={e => { e.preventDefault(); onChange(''); inputRef.current?.focus(); }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-64 overflow-y-auto" ref={listRef}>
          {results.length === 0 ? (
            <div className="p-3 text-center">
              <p className="text-sm text-muted-foreground">검색 결과 없음</p>
              {allowQuickCreate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-primary"
                  onMouseDown={e => {
                    e.preventDefault();
                    setQcForm({ ...qcForm, item_name: value, short_code: value.toUpperCase() });
                    setQuickCreateOpen(true);
                    setOpen(false);
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />새 품목 / 약어 등록
                </Button>
              )}
            </div>
          ) : (
            results.map((item, idx) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center justify-between px-3 py-2 cursor-pointer transition-colors text-sm',
                  idx === selectedIdx ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50'
                )}
                onMouseDown={e => { e.preventDefault(); handleSelect(item); }}
                onMouseEnter={() => setSelectedIdx(idx)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{highlightMatch(item.item_name, value)}</span>
                    {item.short_code && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                        {highlightMatch(item.short_code, value)}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-muted-foreground">{item.category}</span>
                    {item.english_name && (
                      <span className="text-xs text-muted-foreground">· {highlightMatch(item.english_name, value)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Quick create modal */}
      <Dialog open={quickCreateOpen} onOpenChange={setQuickCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>새 품목 / 약어 등록</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label>품목명 *</Label>
              <Input value={qcForm.item_name} onChange={e => setQcForm({ ...qcForm, item_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>약어코드</Label>
                <Input value={qcForm.short_code} onChange={e => setQcForm({ ...qcForm, short_code: e.target.value.toUpperCase() })} placeholder="예: ML" />
              </div>
              <div>
                <Label>영문명</Label>
                <Input value={qcForm.english_name} onChange={e => setQcForm({ ...qcForm, english_name: e.target.value })} placeholder="예: Marinated Lamb" />
              </div>
            </div>
            <div>
              <Label>검색 별칭 (쉼표 구분)</Label>
              <Input value={qcForm.aliases} onChange={e => setQcForm({ ...qcForm, aliases: e.target.value })} placeholder="양갈비, 램찹, lamb" />
            </div>
            <div>
              <Label>카테고리</Label>
              <Input value={qcForm.category} onChange={e => setQcForm({ ...qcForm, category: e.target.value })} placeholder="예: 육류" />
            </div>
            <Button onClick={handleQuickCreate} className="w-full">등록</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
