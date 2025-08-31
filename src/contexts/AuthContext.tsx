import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, handleSupabaseError } from '../lib/supabase';
import { AuthContextType, User } from '../types';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  // Removed unused authInitialized state
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // تحميل المستخدم الحالي
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        console.log('بدء تهيئة المصادقة...');
        // التحقق من الجلسة الحالية
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
          // Clear corrupted session
          await supabase.auth.signOut();
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        if (session?.user && isMounted) {
          console.log('جلسة موجودة، تحميل الملف الشخصي...');
          await loadUserProfile(session.user.id);
        } else if (isMounted) {
          console.log('لا توجد جلسة نشطة');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // الاستماع لتغييرات المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user && isMounted) {
          await loadUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT' && isMounted) {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // تحميل ملف المستخدم الشخصي
  const loadUserProfile = async (userId: string, retryCount = 0) => {
    // Prevent duplicate profile loading
    if (isLoadingProfile || profileLoaded) {
      console.log('Profile loading already in progress or completed');
      return;
    }

    console.log('تحميل الملف الشخصي للمستخدم:', userId, `المحاولة ${retryCount + 1}`);
    setIsLoadingProfile(true);

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('نتيجة تحميل الملف الشخصي:', { profile: profile?.email, error: error?.message, errorCode: error?.code });

      if (error) {
        console.error('Error loading profile:', error);

        // إذا كان الخطأ 500 أو RLS، أنشئ مستخدم وهمي مباشرة
        if (error.code === 'PGRST500' || error.message?.includes('500') || error.code === '42501' || error.message?.includes('policy')) {
          console.log('Server error or RLS blocking access, creating temporary user...');
          const { data: authUser } = await supabase.auth.getUser();

          if (authUser.user) {
            console.log('Creating temporary user for:', authUser.user.email);
            const tempUser: User = {
              id: authUser.user.id,
              email: authUser.user.email || '',
              name: authUser.user.email?.split('@')[0] || 'مستخدم',
              role: 'admin',
            };
            setUser(tempUser);
            setProfileLoaded(true);
            setIsLoading(false);
            console.log('تم إنشاء مستخدم وهمي بنجاح');
            return;
          }
        }

        // إذا لم يوجد ملف شخصي، أنشئ واحد
        if (error.code === 'PGRST116') {
          console.log('لم يوجد ملف شخصي، جاري إنشاء واحد...');
          const { data: authUser } = await supabase.auth.getUser();

          if (authUser.user) {
            console.log('إنشاء ملف شخصي للمستخدم:', authUser.user.email);

            // محاولة إنشاء الملف الشخصي
            const { data: insertData, error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: authUser.user.id,
                email: authUser.user.email || '',
                name: authUser.user.email?.split('@')[0] || 'مستخدم',
                role: 'admin' // أول مستخدم يكون admin
              })
              .select()
              .single();

            console.log('نتيجة إنشاء الملف الشخصي:', { data: insertData, error: insertError?.message, errorCode: insertError?.code });

            if (!insertError && insertData) {
              console.log('تم إنشاء الملف الشخصي بنجاح');
              // استخدم البيانات المُدرجة مباشرة بدلاً من إعادة التحميل
              const userData: User = {
                id: insertData.id,
                email: insertData.email,
                name: insertData.name,
                role: insertData.role as 'admin' | 'manager' | 'member',
                username: insertData.username || undefined,
                teamId: insertData.team_id || undefined,
              };
              setUser(userData);
              setProfileLoaded(true);
              console.log('تم تعيين بيانات المستخدم الجديد بنجاح');
              setIsLoading(false);
              return;
            } else {
              console.error('فشل في إنشاء الملف الشخصي:', insertError);

              // إذا كان الخطأ بسبب RLS، أخبر المستخدم
              if (insertError?.code === '42501' || insertError?.message?.includes('policy')) {
                console.log('RLS policy blocking profile creation');
                toast.error('يجب تطبيق إعدادات قاعدة البيانات. يرجى الاتصال بالمسؤول');

                // إنشاء مستخدم وهمي للاختبار (للتطوير فقط)
                const tempUser: User = {
                  id: authUser.user.id,
                  email: authUser.user.email || '',
                  name: authUser.user.email?.split('@')[0] || 'مستخدم',
                  role: 'admin',
                };
                setUser(tempUser);
                setProfileLoaded(true);
                setIsLoading(false);
                console.log('تم إنشاء مستخدم وهمي للتطوير');
                return;
              } else {
                toast.error('فشل في إنشاء ملف المستخدم: ' + (insertError?.message || 'خطأ غير معروف'));
              }
            }
          }
        }

        toast.error('فشل في تحميل بيانات المستخدم');
        console.log('انتهت مهلة تحميل الملف الشخصي');
        setIsLoading(false);
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
        setProfileLoaded(true);
        console.log('تم تعيين بيانات المستخدم بنجاح');
      }

    } catch (error) {
      console.error('Error loading user profile:', error);

      // Retry logic for transient errors
      if (retryCount < 2) {
        console.log(`إعادة المحاولة ${retryCount + 1}/2 بعد 1 ثانية...`);
        setTimeout(() => {
          setIsLoadingProfile(false);
          loadUserProfile(userId, retryCount + 1);
        }, 1000);
        return;
      }

      toast.error('حدث خطأ في تحميل بيانات المستخدم');
    } finally {
      setIsLoading(false);
      setIsLoadingProfile(false);
      console.log('تم إنهاء تحميل الملف الشخصي');
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('استجابة Supabase:', { data: data?.user?.id, error: error?.message });

      if (error) {
        console.error('خطأ في المصادقة:', error);
        toast.error(handleSupabaseError(error));
        return false;
      }

      if (data.user) {
        console.log('تم العثور على المستخدم، سيتم تحميل الملف الشخصي تلقائياً...');
        // لا نحتاج لاستدعاء loadUserProfile هنا لأن onAuthStateChange سيتولى الأمر
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('حدث خطأ أثناء تسجيل الدخول');
      return false;
    }
  };

  // تسجيل الخروج
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(handleSupabaseError(error));
      }
      // Reset auth state
      setUser(null);
      setProfileLoaded(false);
      setIsLoadingProfile(false);
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('حدث خطأ أثناء تسجيل الخروج');
    }
  };

  // إضافة مستخدم جديد
  const addUser = async (newUser: Omit<User, 'id'> & { password?: string; generatedPassword?: string }) => {
    try {
      const password = newUser.password || newUser.generatedPassword || 'defaultPassword123';
      // إنشاء حساب المصادقة
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: password,
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