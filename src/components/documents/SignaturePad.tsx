import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eraser, Check } from 'lucide-react';

interface Props {
  onChange: (data: { method: 'draw' | 'typed'; dataUrl?: string; typedName?: string } | null) => void;
}

export default function SignaturePad({ onChange }: Props) {
  const [mode, setMode] = useState<'draw' | 'typed'>('draw');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [typedName, setTypedName] = useState('');
  const [confirmTyped, setConfirmTyped] = useState(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    // Account for DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * dpr;
    c.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#fff';
  }, [mode]);

  const getPos = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    drawingRef.current = true;
    lastPtRef.current = getPos(e);
    canvasRef.current?.setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !lastPtRef.current) return;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPtRef.current.x, lastPtRef.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPtRef.current = p;
    setHasDrawn(true);
  };
  const end = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const c = canvasRef.current;
    if (c && hasDrawn) {
      onChange({ method: 'draw', dataUrl: c.toDataURL('image/png') });
    }
  };

  const clear = () => {
    const c = canvasRef.current;
    const ctx = c?.getContext('2d');
    if (c && ctx) ctx.clearRect(0, 0, c.width, c.height);
    setHasDrawn(false);
    onChange(null);
  };

  const handleTypedConfirm = () => {
    if (!typedName.trim()) return;
    setConfirmTyped(true);
    onChange({ method: 'typed', typedName: typedName.trim() });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button type="button" variant={mode === 'draw' ? 'default' : 'outline'} size="sm" onClick={() => { setMode('draw'); onChange(null); clear(); }}>직접 그리기</Button>
        <Button type="button" variant={mode === 'typed' ? 'default' : 'outline'} size="sm" onClick={() => { setMode('typed'); onChange(null); setConfirmTyped(false); }}>이름 입력 서명</Button>
      </div>

      {mode === 'draw' ? (
        <div className="space-y-2">
          <div className="border-2 border-dashed border-border rounded-lg overflow-hidden bg-muted/30">
            <canvas
              ref={canvasRef}
              className="w-full h-40 touch-none cursor-crosshair"
              onPointerDown={start}
              onPointerMove={move}
              onPointerUp={end}
              onPointerLeave={end}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={clear}>
              <Eraser className="w-3.5 h-3.5 mr-1" />다시 작성
            </Button>
            {hasDrawn && <span className="text-xs text-muted-foreground self-center">서명이 입력되었습니다</span>}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            placeholder="서명할 이름을 입력하세요"
            value={typedName}
            onChange={(e) => { setTypedName(e.target.value); setConfirmTyped(false); onChange(null); }}
          />
          {typedName && (
            <div className="rounded-lg border border-border p-4 text-center">
              <p className="text-2xl" style={{ fontFamily: 'cursive' }}>{typedName}</p>
            </div>
          )}
          <Button type="button" size="sm" disabled={!typedName.trim() || confirmTyped} onClick={handleTypedConfirm}>
            <Check className="w-3.5 h-3.5 mr-1" />{confirmTyped ? '서명 완료' : '서명 확정'}
          </Button>
        </div>
      )}
    </div>
  );
}
