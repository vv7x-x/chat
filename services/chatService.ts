import type { Message, User } from '../types';
import { supabase } from './supabaseClient';

export const getMessages = async (): Promise<Message[]> => {
  if (!supabase) return [];
  
  const { data, error } = await supabase
    .from('messages')
    .select(`
      id,
      text,
      sender:users (id, name)
    `)
    .order('id', { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
  
  // The join returns sender as an object or null. We cast it to User.
  // This assumes every message has a valid sender.
  return data.map(msg => ({ ...msg, sender: msg.sender as User })) as Message[];
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
      console.error("Error sending message:", error);
      throw error;
  }
};


export const subscribeToMessages = (onNewMessage: (message: Message) => void) => {
    if (!supabase) return null;

    return supabase
        .channel('public:messages')
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages' },
            async (payload) => {
                // The payload contains the new row, but sender_id is just a UUID.
                // We need to fetch the full message with sender's name.
                const { data: message, error } = await supabase
                    .from('messages')
                    .select('id, text, sender:users(id, name)')
                    .eq('id', payload.new.id)
                    .single();

                if (error) {
                    console.error('Error fetching new message:', error);
                } else if (message) {
                    onNewMessage({ ...message, sender: message.sender as User } as Message);
                }
            }
        )
        .subscribe();
};