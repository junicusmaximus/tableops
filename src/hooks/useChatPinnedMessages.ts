import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PinnedMessageRecord {
  id: string;
  room_id: string;
  message_id: string;
  pinned_by: string;
  pinned_at: string;
  message?: {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    sender_name?: string;
  };
}

export const useChatPinnedMessages = (roomId: string | null) => {
  return useQuery({
    queryKey: ['chat-pinned', roomId],
    queryFn: async (): Promise<PinnedMessageRecord[]> => {
      if (!roomId) return [];
      const db = supabase as any;
      const { data: pins, error } = await db
        .from('chat_pinned_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('pinned_at', { ascending: false });
      if (error) throw error;
      if (!pins?.length) return [];

      const msgIds = pins.map((p: any) => p.message_id);
      const { data: msgs } = await db
        .from('chat_messages')
        .select('id, content, sender_id, created_at')
        .in('id', msgIds);
      const senderIds = [...new Set((msgs ?? []).map((m: any) => m.sender_id))];
      const { data: profs } = await db
        .from('employee_profiles')
        .select('user_id, full_name')
        .in('user_id', senderIds);
      const profMap = new Map<string, string>(
        (profs ?? []).map((p: any) => [p.user_id, p.full_name])
      );
      const msgMap = new Map<string, any>((msgs ?? []).map((m: any) => [m.id, m]));

      return pins.map((p: any) => {
        const m = msgMap.get(p.message_id);
        return {
          ...p,
          message: m
            ? { ...m, sender_name: profMap.get(m.sender_id) ?? '알 수 없음' }
            : undefined,
        };
      });
    },
    enabled: !!roomId,
  });
};

export const useTogglePin = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      roomId,
      messageId,
      action,
    }: {
      roomId: string;
      messageId: string;
      action: 'pin' | 'unpin';
    }) => {
      if (!user) throw new Error('Not authenticated');
      const db = supabase as any;
      if (action === 'pin') {
        const { error } = await db.from('chat_pinned_messages').insert({
          room_id: roomId,
          message_id: messageId,
          pinned_by: user.id,
        });
        if (error && !String(error.message).includes('duplicate')) throw error;
      } else {
        const { error } = await db
          .from('chat_pinned_messages')
          .delete()
          .eq('room_id', roomId)
          .eq('message_id', messageId);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['chat-pinned', vars.roomId] });
    },
  });
};
