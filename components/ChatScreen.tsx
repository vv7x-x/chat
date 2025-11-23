import React, { useState, useRef, useEffect } from 'react';
import type { User, MessageWithExtras } from '../types';
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
  const [messages, setMessages] = useState<MessageWithExtras[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
    if (!trimmedInput && !selectedFile) return;

    setSendError(null); // Clear previous error
    const originalText = inputText;
    setInputText(''); // Optimistically clear the input

    try {
      // if a file is selected but backend doesn't support upload, append filename
      let textToSend = trimmedInput;
      if (selectedFile) {
        textToSend = (trimmedInput ? trimmedInput + ' ' : '') + `[file: ${selectedFile.name}]`;
      }
      await sendMessage(user, textToSend);
      setSelectedFile(null);
    } catch (error: any) {
      console.error("Failed to send message:", error);
      const errorMessage = (error && error.message) ? error.message : "فشل إرسال الرسالة. الرجاء المحاولة مرة أخرى.";
      setSendError(errorMessage);
      setInputText(originalText); // Restore input on failure
    }
  };


  if (!isSupabaseConfigured) {
      return <SupabaseNotice onLogout={onLogout} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
      <header className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-gray-900 shadow-lg p-4 flex justify-between items-center z-10 text-white">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-2xl">💬</div>
          <div className="text-right">
            <h1 className="text-xl font-extrabold">شات عام</h1>
            <p className="text-xs text-indigo-200">مرحباً بك، {user.name}!</p>
            <p className="text-[11px] text-indigo-100/60">عرض الرسائل لآخر 24 ساعة</p>
          </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition duration-300"
          >
            تسجيل خروج
          </button>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto p-6 md:p-8">
        <div className="mx-auto max-w-4xl bg-gray-900/40 rounded-2xl p-4 md:p-6 shadow-inner">
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
                    } my-2`}
                  >
                    {!isCurrentUser && (
                        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-sm flex-shrink-0 ring-2 ring-black/20" title={message.sender.name}>
                            {message.sender.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div
                      className={`max-w-xs md:max-w-md lg:max-w-2xl px-4 py-3 rounded-2xl ${
                        isCurrentUser
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-bl-none'
                          : 'bg-gray-700 text-gray-200 rounded-br-none'
                      } shadow-md hover:shadow-lg transition transform hover:scale-105 relative`}
                    >
                      {!isCurrentUser && (
                        <p className="text-sm font-semibold text-indigo-200 mb-1 text-right">{message.sender.name}</p>
                      )}
                      <p className="text-base break-words">{message.text}</p>
                      {message.created_at && (
                        <p className="text-xxs text-gray-300 mt-2 text-left text-[11px]">{new Date(message.created_at).toLocaleTimeString()}</p>
                      )}
                      {message.attachment && (
                        <div className="mt-2">
                          {message.attachment.type && message.attachment.type.startsWith('image') ? (
                            <img src={message.attachment.url} alt={message.attachment.name} className="max-w-xs rounded-md" />
                          ) : (
                            <a href={message.attachment.url} target="_blank" rel="noreferrer" className="underline text-blue-200">{message.attachment.name || 'ملف'}</a>
                          )}
                        </div>
                      )}
                    </div>
                    {isCurrentUser && (
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0 ring-2 ring-black/20" title={user.name}>
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                  </div>
                )
            })
        )}
        <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="bg-gradient-to-t from-gray-900 to-gray-800 p-4 sticky bottom-0">
        {sendError && <p className="text-red-400 text-center text-sm pb-2">{sendError}</p>}
        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4">
          <div className="relative">
            <button onClick={() => setShowEmojiPicker(v => !v)} className="px-3 py-2 bg-gray-700 rounded-full">😊</button>
            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 bg-gray-800 p-3 rounded-lg shadow-lg grid grid-cols-6 gap-2">
                {['😀','😁','😂','🤣','😊','😍','😎','😭','😡','😮','👍','👎','🙏','👏','🎉','🔥','💯','❤️','😜','🤔','😴','🤖','🌟','🚀'].map(e => (
                  <button key={e} onClick={() => { setInputText(prev => prev + e); setShowEmojiPicker(false); }} className="text-xl">{e}</button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 w-full">
            <label className="px-3 py-2 bg-gray-700 rounded-full cursor-pointer">
              📎
              <input type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} />
            </label>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="اكتب رسالة..."
              className="flex-grow bg-gray-700 text-white px-4 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-right"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() && !selectedFile}
              className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition duration-300"
            >
              إرسال
            </button>
          </div>
          {selectedFile && (
            <div className="mt-2 md:mt-0 text-sm text-gray-300">ملف مختار: {selectedFile.name} <button className="ml-2 text-red-400" onClick={() => setSelectedFile(null)}>إلغاء</button></div>
          )}
        </div>
      </footer>
    </div>
  );
};

export default ChatScreen;