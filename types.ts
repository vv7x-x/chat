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