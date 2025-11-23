import type { Message, User } from '../types';

const MESSAGES_KEY = 'chat_messages';

export const getMessages = (): Message[] => {
  try {
    const messagesJson = localStorage.getItem(MESSAGES_KEY);
    return messagesJson ? JSON.parse(messagesJson) : [];
  } catch (error) {
    console.error("Error parsing messages from localStorage", error);
    return [];
  }
};

const saveMessages = (messages: Message[]) => {
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
};

export const sendMessage = (sender: User, text: string): void => {
  const messages = getMessages();
  const newMessage: Message = {
    id: Date.now(),
    sender,
    text,
  };
  messages.push(newMessage);
  saveMessages(messages);
};
