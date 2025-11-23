import React, { useState, useRef, useEffect } from 'react';
import type { User, Message } from '../types';
import { getMessages, sendMessage, subscribeToMessages } from '../services/chatService';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

// FIX: Defined ChatScreenProps interface for the component's props.
interface ChatScreenProps {
  user: User;
  onLogout: () => void;
}

const SupabaseNotice: React.FC<{onLogout: () => void}> = ({ onLogout }) => (
    <div className="flex flex-col h-screen bg-gray-900 text-white items-center justify-center text-center p-4">
        <div className="w-full max-w-2xl p-8 bg-gray-800 rounded-2xl shadow-2xl">
            <h1 className="text-3xl font-bold text-yellow-300 mb-4">الإعداد مطلوب لتفعيل الدردشة</h1>
            <p className="mb-6 text-gray-300">
                هذا التطبيق يستخدم خدمة Supabase لتمكين الدردشة الفورية عبر الأجهزة. يرجى اتباع الخطوات التالية لإعداده:
            </p>
            <ol className="text-left space-y-4 text-gray-200 list-decimal list-inside mb-8">
                <li>اذهب إلى <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">supabase.com</a> وأنشئ حسابًا ومشروعًا جديدًا (الخطة المجانية كافية).</li>
                <li>من إعدادات المشروع (Project Settings &gt; API)، انسخ <strong>Project URL</strong> ومفتاح <strong>anon public</strong>.</li>
                <li>افتح ملف <code className="bg-gray-700 px-2 py-1 rounded-md text-sm">config.ts</code> في مشروعك والصق القيم المنسوخة.</li>
                <li>من محرر SQL في Supabase، قم بتنفيذ السكريبت لإنشاء الجداول اللازمة (راجع التعليمات).</li>
            </ol>
            <button
                onClick={onLogout}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 font-semibold rounded-lg transition duration-300"
            >
                العودة إلى تسجيل الدخول
            </button>
        </div>
    </div>
);


const ChatScreen: React.FC<ChatScreenProps> = ({ user, onLogout }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
        setIsLoading(false);
        return;
    }
    
    const fetchMessages = async () => {
        try {
            const initialMessages = await getMessages();
            setMessages(initialMessages);
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchMessages();

    const channel = subscribeToMessages((newMessage) => {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    return () => {
        if (supabase && channel) {
            supabase.removeChannel(channel as RealtimeChannel);
        }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput) return;

    setSendError(null); // Clear previous error
    const originalText = inputText;
    setInputText(''); // Optimistically clear the input

    try {
      await sendMessage(user, trimmedInput);
    } catch (error) {
      console.error("Failed to send message:", error);
      setSendError("فشل إرسال الرسالة. الرجاء المحاولة مرة أخرى.");
      setInputText(originalText); // Restore input on failure
    }
  };


  if (!isSupabaseConfigured) {
      return <SupabaseNotice onLogout={onLogout} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <header className="bg-gray-800 shadow-md p-4 flex justify-between items-center z-10">
        <div className="text-right">
          <h1 className="text-xl font-bold text-white">شات عام</h1>
          <p className="text-xs text-gray-400">مرحباً بك، {user.name}!</p>
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition duration-300"
        >
          تسجيل خروج
        </button>
      </header>

      <main className="flex-grow overflow-y-auto p-4 md:p-6 space-y-6">
        {isLoading ? (
            <div className="flex justify-center items-center h-full">
                <p className="text-gray-400">جارِ تحميل الرسائل...</p>
            </div>
        ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-full">
                <p className="text-gray-400">لا توجد رسائل بعد. كن أول من يبدأ المحادثة!</p>
            </div>
        ) : (
            messages.map((message) => {
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
            })
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="bg-gray-800 p-4 sticky bottom-0">
        {sendError && <p className="text-red-400 text-center text-sm pb-2">{sendError}</p>}
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