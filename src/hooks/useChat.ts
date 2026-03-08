import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';

export interface ChatRoom {
  id: string;
  store_id: string;
  name: string;
  type: string;
  created_by: string;
  created_at: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
}

export interface SenderProfile {
  profile_image_url?: string | null;
  position?: string | null;
  phone?: string | null;
  bio?: string | null;
  status?: string | null;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
  sender_name?: string;
  sender_profile?: SenderProfile;
}

export const useChatRooms = () => {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();

  return useQuery({
    queryKey: ['chat-rooms', profile?.store_id],
    queryFn: async () => {
      if (!profile?.store_id) return [];

      // Get rooms for this store
      const { data: rooms, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('store_id', profile.store_id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      if (!rooms?.length) return [];

      // Get last message for each room
      const roomsWithMeta: ChatRoom[] = await Promise.all(
        rooms.map(async (room) => {
          const { data: lastMsg } = await supabase
            .from('chat_messages')
            .select('content, created_at')
            .eq('room_id', room.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get unread count
          const { data: receipt } = await supabase
            .from('chat_read_receipts')
            .select('last_read_at')
            .eq('room_id', room.id)
            .eq('user_id', user!.id)
            .maybeSingle();

          let unreadCount = 0;
          if (receipt?.last_read_at) {
            const { count } = await supabase
              .from('chat_messages')
              .select('*', { count: 'exact', head: true })
              .eq('room_id', room.id)
              .gt('created_at', receipt.last_read_at)
              .neq('sender_id', user!.id);
            unreadCount = count ?? 0;
          } else {
            const { count } = await supabase
              .from('chat_messages')
              .select('*', { count: 'exact', head: true })
              .eq('room_id', room.id)
              .neq('sender_id', user!.id);
            unreadCount = count ?? 0;
          }

          return {
            ...room,
            last_message: lastMsg?.content,
            last_message_at: lastMsg?.created_at,
            unread_count: unreadCount,
          };
        })
      );

      return roomsWithMeta;
    },
    enabled: !!user && !!profile?.store_id,
  });
};

export const useChatMessages = (roomId: string | null) => {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!roomId) return [];

      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      // Enrich with sender names and profile data
      const senderIds = [...new Set(messages?.map((m) => m.sender_id) ?? [])];
      const db = supabase as any;
      const { data: profiles } = await db
        .from('employee_profiles')
        .select('user_id, full_name, profile_image_url, position, phone, bio, status')
        .in('user_id', senderIds);

      const profileMap = new Map<string, any>(profiles?.map((p: any) => [p.user_id, p]) ?? []);

      return (messages ?? []).map((m) => {
        const prof = profileMap.get(m.sender_id);
        return {
          ...m,
          sender_name: prof?.full_name ?? '알 수 없음',
          sender_profile: prof ? {
            profile_image_url: prof.profile_image_url,
            position: prof.position,
            phone: prof.phone,
            bio: prof.bio,
            status: prof.status,
          } : undefined,
        } as ChatMessage;
      });
    },
    enabled: !!roomId && !!user,
  });

  // Realtime subscription
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`chat-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] });
          queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);

  return query;
};

export const useSendMessage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, content }: { roomId: string; content: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('chat_messages').insert({
        room_id: roomId,
        sender_id: user.id,
        content,
      });

      if (error) throw error;
    },
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] });
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    },
  });
};

export const useMarkAsRead = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useCallback(
    async (roomId: string) => {
      if (!user) return;

      const { data: existing } = await supabase
        .from('chat_read_receipts')
        .select('id')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('chat_read_receipts')
          .update({ last_read_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase.from('chat_read_receipts').insert({
          room_id: roomId,
          user_id: user.id,
          last_read_at: new Date().toISOString(),
        });
      }

      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    },
    [user, queryClient]
  );
};

export const useCreateChatRoom = () => {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, type = 'group' }: { name: string; type?: string }) => {
      if (!user || !profile?.store_id) throw new Error('Not authenticated');

      // Create room
      const { data: room, error } = await supabase
        .from('chat_rooms')
        .insert({
          store_id: profile.store_id,
          name,
          type,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as member
      await supabase.from('chat_room_members').insert({
        room_id: room.id,
        user_id: user.id,
      });

      // Add all store members
      const { data: storeMembers } = await supabase
        .from('user_store_roles')
        .select('user_id')
        .eq('store_id', profile.store_id);

      if (storeMembers?.length) {
        const members = storeMembers
          .filter((m) => m.user_id !== user.id)
          .map((m) => ({ room_id: room.id, user_id: m.user_id }));

        if (members.length) {
          await supabase.from('chat_room_members').insert(members);
        }
      }

      return room;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    },
  });
};
