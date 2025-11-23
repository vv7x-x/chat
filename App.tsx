import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import ChatScreen from './components/ChatScreen';
import type { User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (loggedInUser: User) => {
    // Storing user in session storage to persist login across reloads
    sessionStorage.setItem('chat_current_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('chat_current_user');
    setUser(null);
  };

  useEffect(() => {
    // Check if user is already logged in (e.g., after a page refresh)
    try {
        const storedUserJson = sessionStorage.getItem('chat_current_user');
        if (storedUserJson) {
            setUser(JSON.parse(storedUserJson));
        }
    } catch (error) {
        console.error("Failed to parse user from sessionStorage", error);
        sessionStorage.removeItem('chat_current_user');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {user ? (
        <ChatScreen user={user} onLogout={handleLogout} />
      ) : (
        <LoginScreen onLogin={handleLogin} />
      )}
    </div>
  );
};

export default App;