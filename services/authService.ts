import type { User } from '../types';
import { supabase } from './supabaseClient';

export const register = async (username: string, password: string): Promise<{ success: boolean; message: string; user?: User }> => {
  if (!username.trim() || !password.trim()) {
    return { success: false, message: 'الرجاء إدخال اسم المستخدم وكلمة المرور' };
  }
  if (!supabase) {
    return { success: false, message: 'خدمة قاعدة البيانات غير مهيأة.' };
  }

  try {
    // Check if user already exists
    const { data: existingUsers, error: selectError } = await supabase
        .from('users')
        .select('id')
        .ilike('name', username.trim());
    
    if (selectError) throw selectError;

    if (existingUsers && existingUsers.length > 0) {
        return { success: false, message: 'اسم المستخدم موجود بالفعل' };
    }

    // Insert new user
    // WARNING: Storing plain text passwords is not secure for production applications.
    // Consider using Supabase Auth or hashing passwords.
    const { data, error: insertError } = await supabase
        .from('users')
        .insert({ name: username.trim(), password: password })
        .select('id, name')
        .single();
    
    if (insertError) throw insertError;
    
    return { success: true, message: 'تم إنشاء الحساب بنجاح!', user: data as User };

  } catch (error: any) {
    console.error("Registration error:", error);
    return { success: false, message: error.message || 'حدث خطأ أثناء إنشاء الحساب.' };
  }
};

export const login = async (username: string, password: string): Promise<{ success: boolean; message: string; user?: User }> => {
    if (!username.trim() || !password.trim()) {
      return { success: false, message: 'الرجاء إدخال اسم المستخدم وكلمة المرور' };
    }
    if (!supabase) {
      return { success: false, message: 'خدمة قاعدة البيانات غير مهيأة.' };
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, name')
            .ilike('name', username.trim())
            .eq('password', password)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is not an actual error for login
            throw error;
        }

        if (data) {
            return { success: true, message: 'تم تسجيل الدخول بنجاح!', user: data as User };
        }
        
        return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };

    } catch (error: any) {
        console.error("Login error:", error);
        return { success: false, message: error.message || 'حدث خطأ أثناء تسجيل الدخول.' };
    }
};