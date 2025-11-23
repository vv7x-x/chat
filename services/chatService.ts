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
  
  if (!data) {
      return [];
  }

  // FIX: The Supabase join can return an array of users. Filter out messages where the sender is null or the array is empty.
  const validMessages = data.filter(msg => msg.sender && (msg.sender as any[]).length > 0);

  // FIX: The join returns sender as an array containing one user. We must extract the first element.
  return validMessages.map(msg => ({ ...msg, sender: (msg.sender as any[])[0] as User })) as Message[];
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


export const subscribeToMessages = (onNewMessage: (message: Message) => void) => {
    if (!supabase) return null;

    return supabase
        .channel('realtime_messages')
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages' },
            async (payload) => {
                const newMessageData = payload.new as { id: number; text: string; sender_id: string; };
                
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
                    const fullMessage: Message = {
                        id: newMessageData.id,
                        text: newMessageData.text,
                        sender: sender as User,
                    };
                    onNewMessage(fullMessage);
                }
            }
        )
        .subscribe();
};