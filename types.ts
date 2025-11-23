export interface User {
  id: string;
  name: string;
  password?: string; // For storage during registration/login check
}

export interface Message {
  id: number;
  text: string;
  sender: User;
}

export interface Attachment {
  url: string;
  name?: string;
  type?: string;
}

export interface Reaction {
  emoji: string;
  userIds: string[];
}

export interface MessageWithExtras extends Message {
  attachment?: Attachment | null;
  reactions?: Reaction[];
  created_at?: string;
}