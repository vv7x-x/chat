import type { User } from '../types';

const USERS_KEY = 'chat_users';

export const getUsers = (): User[] => {
  try {
    const usersJson = localStorage.getItem(USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  } catch (error) {
    console.error("Error parsing users from localStorage", error);
    return [];
  }
};

const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const register = (username: string, password: string): { success: boolean; message: string; user?: User } => {
  if (!username.trim() || !password.trim()) {
    return { success: false, message: 'الرجاء إدخال اسم المستخدم وكلمة المرور' };
  }
  const users = getUsers();
  if (users.some(u => u.name.toLowerCase() === username.toLowerCase())) {
    return { success: false, message: 'اسم المستخدم موجود بالفعل' };
  }
  const newUser: User = { id: Date.now().toString(), name: username, password };
  users.push(newUser);
  saveUsers(users);
  const { password: _, ...userWithoutPassword } = newUser;
  return { success: true, message: 'تم إنشاء الحساب بنجاح!', user: userWithoutPassword };
};

export const login = (username: string, password: string): { success: boolean; message: string; user?: User } => {
    if (!username.trim() || !password.trim()) {
      return { success: false, message: 'الرجاء إدخال اسم المستخدم وكلمة المرور' };
    }
    const users = getUsers();
    const foundUser = users.find(u => u.name.toLowerCase() === username.toLowerCase() && u.password === password);
    if (foundUser) {
        const { password: _, ...userWithoutPassword } = foundUser;
        return { success: true, message: 'تم تسجيل الدخول بنجاح!', user: userWithoutPassword };
    }
    return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
};
