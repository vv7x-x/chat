import React, { useState } from 'react';
import { register, login } from '../services/authService';
import type { User } from '../types';
import { isSupabaseConfigured } from '../services/supabaseClient';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  const handleAuthAction = async (action: 'login' | 'register') => {
    if (!isSupabaseConfigured) {
        setError('التطبيق غير مهيأ. الرجاء اتباع التعليمات لإضافة مفاتيح Supabase.');
        return;
    }
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    const result = await (action === 'login' ? login(username, password) : register(username, password));
    
    if (result.success && result.user) {
        if (action === 'register') {
            setSuccessMessage(result.message + " يمكنك الآن تسجيل الدخول.");
            setUsername('');
            setPassword('');
        } else {
             onLogin(result.user);
        }
    } else {
      setError(result.message);
    }
    setIsLoading(false);
  };


  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="w-full max-w-sm p-8 space-y-8 bg-gray-800 rounded-2xl shadow-2xl">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-4xl">💬</div>
          <h1 className="text-3xl font-bold text-white mt-4">شات جماعي</h1>
          <p className="mt-2 text-gray-400">انضم إلى المحادثة</p>
        </div>
        {!isSupabaseConfigured && (
          <div className="p-4 text-sm text-yellow-200 bg-yellow-900/50 rounded-lg text-center">
            <p className="font-bold">خطوة الإعداد مطلوبة!</p>
            <p>لتمكين الدردشة في الوقت الفعلي، يرجى إعداد بيانات اعتماد Supabase في ملف `config.ts`.</p>
          </div>
        )}
        <div className="space-y-6">
          <div>
            <label htmlFor="username" className="text-sm font-medium text-gray-300 block text-right">
              البريد الإلكتروني
            </label>
            <input
              id="username"
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-right"
              placeholder="ادخل بريدك الإلكتروني"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="password"  className="text-sm font-medium text-gray-300 block text-right">
              كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-right"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          {successMessage && <p className="text-sm text-green-400 text-center">{successMessage}</p>}
          <div className="flex flex-col space-y-3">
             <button
                onClick={() => handleAuthAction('login')}
                disabled={!username || !password || isLoading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white font-semibold text-center transition duration-200 transform hover:scale-102 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {isLoading ? 'جارِ الدخول...' : 'دخول'}
              </button>
              <button
                onClick={() => handleAuthAction('register')}
                disabled={!username || !password || isLoading}
                className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 rounded-md text-white font-semibold text-center transition duration-200"
              >
                {isLoading ? 'جارِ الإنشاء...' : 'إنشاء حساب'}
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;