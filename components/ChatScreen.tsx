import React, { useState, useRef, useEffect } from 'react';
import type { User, Message } from '../types';
import { getMessages, sendMessage } from '../services/chatService';

interface ChatScreenProps {
  user: User;
  onLogout: () => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ user, onLogout }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(getMessages());

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'chat_messages' && event.newValue) {
        setMessages(JSON.parse(event.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput) return;

    sendMessage(user, trimmedInput);
    setMessages(getMessages());
    setInputText('');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <header className="bg-gray-800 shadow-md p-4 flex justify-between items-center z-10">
        <div className="text-right">
          <h1 className="text-xl font-bold text-white">شات عام</h1>
          <p className="text-xs text-gray-400">ملاحظة: الرسائل محفوظة على هذا الجهاز فقط</p>
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition duration-300"
        >
          تسجيل خروج
        </button>
      </header>

      <main className="flex-grow overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((message) => {
            const isCurrentUser = message.sender.id === user.id;
            return (
              <div
                key={message.id}
                className={`flex items-end gap-3 ${
                  isCurrentUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isCurrentUser && (
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-sm flex-shrink-0" title={message.sender.name}>
                        {message.sender.name.charAt(0).toUpperCase()}
                    </div>
                )}
                <div
                  className={`max-w-xs md:max-w-md lg:max-w-2xl px-4 py-3 rounded-2xl ${
                    isCurrentUser
                      ? 'bg-blue-600 text-white rounded-bl-none'
                      : 'bg-gray-700 text-gray-200 rounded-br-none'
                  }`}
                >
                  {!isCurrentUser && (
                    <p className="text-sm font-semibold text-indigo-300 mb-1 text-right">{message.sender.name}</p>
                  )}
                  <p className="text-base break-words">{message.text}</p>
                </div>
                {isCurrentUser && (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0" title={user.name}>
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                )}
              </div>
            )
        })}
        <div ref={messagesEndRef} />
      </main>

      <footer className="bg-gray-800 p-4 sticky bottom-0">
        <div className="flex items-center space-x-4 flex-row-reverse">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="اكتب رسالة..."
            className="flex-grow bg-gray-700 text-white px-4 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-right"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ChatScreen;