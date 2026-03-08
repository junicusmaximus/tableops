import { useShiftTemplates, useCreateShiftTemplate, useDeleteShiftTemplate, ShiftTemplate } from '@/hooks/useShiftTemplates';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Bookmark, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';

interface Props {
  onSelect: (t: ShiftTemplate) => void;
  currentValues?: { start_time: string; end_time: string; break_minutes: string; role: string };
}

export default function ShiftTemplateSelector({ onSelect, currentValues }: Props) {
  const { data: templates = [] } = useShiftTemplates();
  const createTemplate = useCreateShiftTemplate();
  const deleteTemplate = useDeleteShiftTemplate();
  const [showSave, setShowSave] = useState(false);
  const [name, setName] = useState('');

  const handleSave = async () => {
    if (!name.trim() || !currentValues) return;
    await createTemplate.mutateAsync({
      name: name.trim(),
      start_time: currentValues.start_time,
      end_time: currentValues.end_time,
      break_minutes: parseInt(currentValues.break_minutes) || 0,
      role: currentValues.role || null,
    });
    setName('');
    setShowSave(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <Bookmark className="w-3 h-3" />시프트 템플릿
        </Label>
        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowSave(true)}>
          <Plus className="w-3 h-3 mr-1" />현재 값 저장
        </Button>
      </div>
      {templates.length === 0 ? (
        <p className="text-xs text-muted-foreground">저장된 템플릿이 없습니다</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {templates.map((t) => (
            <Badge
              key={t.id}
              variant="outline"
              className="cursor-pointer hover:bg-accent transition-colors group pr-1"
              onClick={() => onSelect(t)}
            >
              <span className="mr-1">{t.name}</span>
              <span className="text-muted-foreground text-[10px]">
                {t.start_time?.slice(0, 5)}~{t.end_time?.slice(0, 5)}
              </span>
              <button
                className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); deleteTemplate.mutate(t.id); }}
              >
                <X className="w-3 h-3 text-destructive" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Dialog open={showSave} onOpenChange={setShowSave}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>템플릿 저장</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>템플릿 이름</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 오픈 홀, 마감 주방" /></div>
            {currentValues && (
              <p className="text-xs text-muted-foreground">
                {currentValues.start_time}~{currentValues.end_time} / 휴게 {currentValues.break_minutes}분
                {currentValues.role && ` / ${currentValues.role}`}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSave(false)}>취소</Button>
            <Button onClick={handleSave} disabled={!name.trim() || createTemplate.isPending}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
