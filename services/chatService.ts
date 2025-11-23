import type { MessageWithExtras, User } from '../types';
import { supabase } from './supabaseClient';

export const getMessages = async (): Promise<MessageWithExtras[]> => {
  if (!supabase) return [];

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('messages')
    .select(`
      id,
      text,
      attachment_url,
      attachment_name,
      attachment_type,
      created_at,
      sender:users (id, name)
    `)
    .gte('created_at', cutoff)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }

  if (!data) return [];

  const validMessages = data.filter((msg: any) => msg.sender && (msg.sender as any[]).length > 0);

  return validMessages.map((msg: any) => {
    const sender = (msg.sender as any[])[0] as User;
    const m: MessageWithExtras = {
      id: msg.id,
      text: msg.text,
      sender,
      created_at: msg.created_at || undefined,
      attachment: msg.attachment_url ? { url: msg.attachment_url, name: msg.attachment_name, type: msg.attachment_type } : undefined,
      reactions: [],
    };
    return m;
  });
};

export const sendMessage = async (sender: User, text: string): Promise<void> => {
  if (!supabase) return;

  const { error } = await supabase
    .from('messages')
    .insert({
      text,
      sender_id: sender.id,
    });
  
  if (error) {
      console.error("Error sending message:", error.message || error);
      throw error;
  }
};


export const subscribeToMessages = (onNewMessage: (message: MessageWithExtras) => void) => {
    if (!supabase) return null;

    return supabase
        .channel('realtime_messages')
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages' },
            async (payload) => {
        const newMessageData = payload.new as { id: number; text: string; sender_id: string; created_at?: string; attachment_url?: string; attachment_name?: string; attachment_type?: string };
                
                // After getting a new message, fetch its sender's details separately.
                // This is more robust than relying on a complex join in the subscription.
                const { data: sender, error: userError } = await supabase
                    .from('users')
                    .select('id, name')
                    .eq('id', newMessageData.sender_id)
                    .single();

                if (userError) {
                    console.error('Error fetching sender for new message:', userError);
                    return; // Do not process a message if we can't find its sender.
                }

                if (sender) {
          const fullMessage: MessageWithExtras = {
            id: newMessageData.id,
            text: newMessageData.text,
            sender: sender as User,
            created_at: newMessageData.created_at,
            attachment: newMessageData.attachment_url ? { url: newMessageData.attachment_url, name: newMessageData.attachment_name, type: newMessageData.attachment_type } : undefined,
            reactions: [],
          };
          onNewMessage(fullMessage);
                }
            }
        )
        .subscribe();
};

/**
 * Attempt to delete messages older than 24 hours. This helper may fail with the
 * anon/public key if delete permissions are not granted. Prefer running a
 * server-side scheduled job with a service role key for reliable cleanup.
 */
export const deleteExpiredMessages = async (): Promise<{ deleted?: number } | null> => {
  if (!supabase) return null;
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  try {
    const { error, count } = await supabase
      .from('messages')
      .delete()
      .lt('created_at', cutoff)
      .select('*', { count: 'exact' });

    if (error) {
      console.warn('deleteExpiredMessages: failed (likely permission issue):', error.message || error);
      return null;
    }
    return { deleted: typeof count === 'number' ? count : undefined };
  } catch (err: any) {
    console.error('deleteExpiredMessages error:', err.message || err);
    return null;
  }
};