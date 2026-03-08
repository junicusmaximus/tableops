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
  pinned_message_id?: string | null;
  pinned_at?: string | null;
  pinned_by?: string | null;
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
  file_url?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  read_count?: number;
  mentions?: string[];
}

// Parse @mentions from message content, returns array of user_ids
export const parseMentions = (content: string, members: { user_id: string; full_name: string }[]): string[] => {
  const mentioned: string[] = [];
  for (const member of members) {
    if (content.includes(`@${member.full_name}`)) {
      mentioned.push(member.user_id);
    }
  }
  return mentioned;
};

export const useChatRooms = () => {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();

  return useQuery({
    queryKey: ['chat-rooms', profile?.store_id],
    queryFn: async () => {
      if (!profile?.store_id) return [];

      const db = supabase as any;
      const { data: rooms, error } = await db
        .from('chat_rooms')
        .select('*')
        .eq('store_id', profile.store_id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      if (!rooms?.length) return [];

      const roomsWithMeta: ChatRoom[] = await Promise.all(
        rooms.map(async (room: any) => {
          const { data: lastMsg } = await supabase
            .from('chat_messages')
            .select('content, created_at')
            .eq('room_id', room.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

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
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!roomId) return [];

      const db = supabase as any;
      const { data: messages, error } = await db
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      // Enrich with sender names and profile data
      const senderIds = [...new Set(messages?.map((m: any) => m.sender_id) ?? [])];
      const { data: profiles } = await db
        .from('employee_profiles')
        .select('user_id, full_name, profile_image_url, position, phone, bio, status')
        .in('user_id', senderIds);

      const profileMap = new Map<string, any>(profiles?.map((p: any) => [p.user_id, p]) ?? []);

      // Get read counts: count how many users have read_at >= message.created_at
      const { data: receipts } = await supabase
        .from('chat_read_receipts')
        .select('user_id, last_read_at')
        .eq('room_id', roomId);

      const receiptList = receipts ?? [];

      return (messages ?? []).map((m: any) => {
        const prof = profileMap.get(m.sender_id);
        // Count users who have read this message (read_at >= message created_at)
        const readCount = receiptList.filter(
          (r) => r.user_id !== m.sender_id && new Date(r.last_read_at) >= new Date(m.created_at)
        ).length;

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
          read_count: readCount,
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
    mutationFn: async ({
      roomId,
      content,
      fileUrl,
      fileName,
      fileType,
      mentionedUserIds,
    }: {
      roomId: string;
      content: string;
      fileUrl?: string;
      fileName?: string;
      fileType?: string;
      mentionedUserIds?: string[];
    }) => {
      if (!user) throw new Error('Not authenticated');

      const db = supabase as any;
      const { data: msg, error } = await db.from('chat_messages').insert({
        room_id: roomId,
        sender_id: user.id,
        content,
        file_url: fileUrl ?? null,
        file_name: fileName ?? null,
        file_type: fileType ?? null,
      }).select().single();

      if (error) throw error;

      // Insert mentions
      if (mentionedUserIds?.length && msg) {
        const mentionRows = mentionedUserIds.map((uid) => ({
          message_id: msg.id,
          mentioned_user_id: uid,
          room_id: roomId,
        }));
        await db.from('chat_mentions').insert(mentionRows);

        // Create notifications for mentioned users
        const { data: senderProfile } = await supabase
          .from('employee_profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .maybeSingle();

        const senderName = senderProfile?.full_name ?? '알 수 없음';
        const notifs = mentionedUserIds
          .filter((uid) => uid !== user.id)
          .map((uid) => ({
            user_id: uid,
            type: 'chat_mention',
            title: `${senderName}님이 회원님을 멘션했습니다`,
            message: content.length > 50 ? content.slice(0, 50) + '...' : content,
            related_entity_type: 'chat_room',
            related_entity_id: roomId,
            created_by: user.id,
          }));

        if (notifs.length) {
          await db.from('notifications').insert(notifs);
        }
      }
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
      queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] });
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

      await supabase.from('chat_room_members').insert({
        room_id: room.id,
        user_id: user.id,
      });

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

export const usePinMessage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, messageId }: { roomId: string; messageId: string | null }) => {
      if (!user) throw new Error('Not authenticated');

      const db = supabase as any;
      const { error } = await db
        .from('chat_rooms')
        .update({
          pinned_message_id: messageId,
          pinned_at: messageId ? new Date().toISOString() : null,
          pinned_by: messageId ? user.id : null,
        })
        .eq('id', roomId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
    },
  });
};

export const useUploadChatFile = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat_files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('chat_files')
        .getPublicUrl(filePath);

      return {
        url: data.publicUrl,
        name: file.name,
        type: file.type,
      };
    },
  });
};
