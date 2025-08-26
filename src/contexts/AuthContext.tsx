import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, handleSupabaseError } from '../lib/supabase';
import { AuthContextType, User } from '../types';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  // تحميل المستخدم الحالي
  useEffect(() => {
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
    console.log('تحميل الملف الشخصي للمستخدم:', userId);
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('نتيجة تحميل الملف الشخصي:', { profile: profile?.email, error: error?.message });

      if (error) {
        console.error('Error loading profile:', error);
        
        // إذا لم يوجد ملف شخصي، أنشئ واحد
        if (error.code === 'PGRST116') {
          console.log('لم يوجد ملف شخصي، جاري إنشاء واحد...');
          const { data: authUser } = await supabase.auth.getUser();
          
          if (authUser.user) {
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: authUser.user.id,
                email: authUser.user.email || '',
                name: authUser.user.email?.split('@')[0] || 'مستخدم',
                role: 'member'
              });
            
            if (!insertError) {
              console.log('تم إنشاء الملف الشخصي بنجاح');
              // إعادة تحميل الملف الشخصي
              return loadUserProfile(userId);
            }
          }
        }
        
        toast.error('فشل في تحميل بيانات المستخدم');
        return;
      }

      if (profile) {
        console.log('تم تحميل الملف الشخصي:', profile.name);
        const userData: User = {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role as 'admin' | 'manager' | 'member',
          username: profile.username || undefined,
          teamId: profile.team_id || undefined,
        };
        setUser(userData);
        console.log('تم تعيين بيانات المستخدم بنجاح');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast.error('حدث خطأ في تحميل بيانات المستخدم');
      setIsLoading(false);
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
    console.log('بدء عملية تسجيل الدخول:', email);
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('استجابة Supabase:', { data: data?.user?.id, error: error?.message });

      if (error) {
        console.error('خطأ في المصادقة:', error);
        if (error.message.includes('Invalid login credentials')) {
          toast.error('بيانات الدخول غير صحيحة. تأكد من البريد الإلكتروني وكلمة المرور');
        } else {
          toast.error(handleSupabaseError(error));
        }
        return false;
      }

      if (data.user) {
        console.log('تم العثور على المستخدم، جاري تحميل الملف الشخصي...');
        await loadUserProfile(data.user.id);
        console.log('تم تحميل الملف الشخصي بنجاح');
        
        // Ensure user state is set before returning success
        const maxWaitTime = 3000; // 3 seconds
        const startTime = Date.now();
        
        while (!user && (Date.now() - startTime) < maxWaitTime) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log('حالة المستخدم النهائية:', user ? 'تم التحميل' : 'لم يتم التحميل');
        return true;
      }

      console.log('لم يتم العثور على بيانات المستخدم');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('حدث خطأ أثناء تسجيل الدخول');
      return false;
    } finally {
      setIsLoading(false);
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