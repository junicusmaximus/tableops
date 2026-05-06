import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ChatReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
}

export const REACTION_OPTIONS = [
  '✅', '👍', '👏', '🔥', '❗', '❓',
  '❤️', '🎉', '😂', '😮', '🙏', '👀',
  '💯', '🚀', '☕', '🍚', '🥲', '😴',
] as const;

export const useChatReactions = (roomId: string | null, messageIds: string[]) => {
  const queryClient = useQueryClient();
  const key = ['chat-reactions', roomId];

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<ChatReaction[]> => {
      if (!roomId || !messageIds.length) return [];
      const { data, error } = await (supabase as any)
        .from('chat_reactions')
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
      .channel(`reactions-${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_reactions' }, () => {
        queryClient.invalidateQueries({ queryKey: key });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);

  return query;
};

export const useToggleReaction = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ messageId, reactionType }: { messageId: string; reactionType: string }) => {
      if (!user) throw new Error('Not authenticated');
      const db = supabase as any;
      const { data: existing } = await db
        .from('chat_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('reaction_type', reactionType)
        .maybeSingle();
      if (existing) {
        await db.from('chat_reactions').delete().eq('id', existing.id);
      } else {
        await db.from('chat_reactions').insert({
          message_id: messageId,
          user_id: user.id,
          reaction_type: reactionType,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-reactions'] });
    },
  });
};
