import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, handleSupabaseError } from '../lib/supabase';
import { AuthContextType, User } from '../types';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// إنشاء مستخدمين تجريبيين
const createDemoUsers = async () => {
  const demoUsers = [
    { email: 'admin@demo.com', password: 'password123', name: 'مدير النظام', role: 'admin' },
    { email: 'manager@demo.com', password: 'password123', name: 'مدير الفريق', role: 'manager' },
    { email: 'member@demo.com', password: 'password123', name: 'عضو الفريق', role: 'member' }
  ];

  for (const user of demoUsers) {
    try {
      // التحقق من وجود المستخدم
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!existingProfile) {
        // إنشاء المستخدم في المصادقة
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true
        });

        if (authError) {
          console.log(`Failed to create demo user ${user.email}:`, authError.message);
          continue;
        }

        if (authData.user) {
          // إنشاء الملف الشخصي
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: user.email,
              name: user.name,
              role: user.role
            });

          if (profileError) {
            console.log(`Failed to create profile for ${user.email}:`, profileError.message);
          } else {
            console.log(`Demo user created: ${user.email}`);
          }
        }
      }
    } catch (error) {
      console.log(`Error creating demo user ${user.email}:`, error);
    }
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  // تحميل المستخدم الحالي
  useEffect(() => {
    // إنشاء المستخدمين التجريبيين عند بدء التطبيق
    createDemoUsers();

    // التحقق من الجلسة الحالية
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // الاستماع لتغييرات المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // تحميل ملف المستخدم الشخصي
  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        setIsLoading(false);
        return;
      }

      if (profile) {
        const userData: User = {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role as 'admin' | 'manager' | 'member',
          username: profile.username || undefined,
          teamId: profile.team_id || undefined,
        };
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // تحميل جميع المستخدمين (للمديرين)
  const loadUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        return;
      }

      const usersData: User[] = profiles.map(profile => ({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role as 'admin' | 'manager' | 'member',
        username: profile.username || undefined,
        teamId: profile.team_id || undefined,
      }));

      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  // تسجيل الدخول
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('بيانات الدخول غير صحيحة. تأكد من البريد الإلكتروني وكلمة المرور');
        } else {
          toast.error(handleSupabaseError(error));
        }
        setIsLoading(false);
        return false;
      }

      if (data.user) {
        await loadUserProfile(data.user.id);
        toast.success('تم تسجيل الدخول بنجاح');
        return true;
      }

      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('حدث خطأ أثناء تسجيل الدخول');
      setIsLoading(false);
      return false;
    }
  };

  // تسجيل الخروج
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(handleSupabaseError(error));
      } else {
        setUser(null);
        toast.success('تم تسجيل الخروج بنجاح');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('حدث خطأ أثناء تسجيل الخروج');
    }
  };

  // إضافة مستخدم جديد
  const addUser = async (newUser: Omit<User, 'id'> & { password: string }) => {
    try {
      // إنشاء حساب المصادقة
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
      });

      if (authError) {
        toast.error(handleSupabaseError(authError));
        return;
      }

      if (authData.user) {
        // إنشاء الملف الشخصي
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
            username: newUser.username,
            team_id: newUser.teamId,
          });

        if (profileError) {
          toast.error(handleSupabaseError(profileError));
          return;
        }

        toast.success('تم إنشاء المستخدم بنجاح');
        await loadUsers(); // إعادة تحميل قائمة المستخدمين
      }
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('حدث خطأ أثناء إنشاء المستخدم');
    }
  };

  // تحميل المستخدمين عند تسجيل الدخول كمدير
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'manager')) {
      loadUsers();
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading, 
      addUser, 
      users 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};