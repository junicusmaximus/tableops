import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TypingPayload {
  user_id: string;
  full_name: string;
  ts: number;
}

const TYPING_TIMEOUT_MS = 4000;

export const useTypingIndicator = (roomId: string | null, myName: string | undefined) => {
  const { user } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastSent = useRef(0);
  const [typing, setTyping] = useState<TypingPayload[]>([]);

  useEffect(() => {
    if (!roomId || !user) return;
    const ch = supabase.channel(`typing-${roomId}`, {
      config: { broadcast: { self: false } },
    });
    ch.on('broadcast', { event: 'typing' }, ({ payload }) => {
      const p = payload as TypingPayload;
      if (!p || p.user_id === user.id) return;
      setTyping((prev) => {
        const now = Date.now();
        const filtered = prev.filter(
          (x) => x.user_id !== p.user_id && now - x.ts < TYPING_TIMEOUT_MS,
        );
        return [...filtered, { ...p, ts: now }];
      });
    });
    ch.subscribe();
    channelRef.current = ch;

    const interval = setInterval(() => {
      const now = Date.now();
      setTyping((prev) => prev.filter((x) => now - x.ts < TYPING_TIMEOUT_MS));
    }, 1000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(ch);
      channelRef.current = null;
      setTyping([]);
    };
  }, [roomId, user?.id]);

  const broadcastTyping = useCallback(() => {
    if (!channelRef.current || !user) return;
    const now = Date.now();
    if (now - lastSent.current < 1500) return;
    lastSent.current = now;
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user.id, full_name: myName ?? '누군가', ts: now },
    });
  }, [user?.id, myName]);

  return { typingUsers: typing, broadcastTyping };
};
