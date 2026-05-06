import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ChatConfirmation {
  id: string;
  message_id: string;
  user_id: string;
  confirmed_at: string;
}

export const useChatConfirmations = (roomId: string | null, messageIds: string[]) => {
  const queryClient = useQueryClient();
  const key = ['chat-confirmations', roomId];

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<ChatConfirmation[]> => {
      if (!roomId || !messageIds.length) return [];
      const { data, error } = await (supabase as any)
        .from('chat_confirmations')
        .select('*')
        .in('message_id', messageIds);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!roomId && messageIds.length > 0,
  });

  useEffect(() => {
    if (!roomId) return;
    const channel = supabase
      .channel(`confirmations-${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_confirmations' }, () => {
        queryClient.invalidateQueries({ queryKey: key });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);

  return query;
};

export const useToggleConfirmation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ messageId }: { messageId: string }) => {
      if (!user) throw new Error('Not authenticated');
      const db = supabase as any;
      const { data: existing } = await db
        .from('chat_confirmations')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (existing) {
        await db.from('chat_confirmations').delete().eq('id', existing.id);
      } else {
        await db.from('chat_confirmations').insert({
          message_id: messageId,
          user_id: user.id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-confirmations'] });
    },
  });
};
