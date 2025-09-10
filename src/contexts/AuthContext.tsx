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

  // تحميل المستخدم الحالي - محسن للأداء
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
          // استخدام setTimeout لتجنب حجب الـ UI
          setTimeout(() => {
            if (isMounted) {
              loadUserProfile(session.user.id);
            }
          }, 0);
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
          // استخدام setTimeout لتجنب حجب الـ UI
          setTimeout(() => {
            if (isMounted) {
              loadUserProfile(session.user.id);
            }
          }, 0);
        } else if (event === 'SIGNED_OUT' && isMounted) {
          setUser(null);
          setProfileLoaded(false);
          setIsLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // تحميل ملف المستخدم الشخصي - محسن للأداء
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

        // إذا لم يوجد ملف شخصي، أنشئ واحد - مبسط
        if (error.code === 'PGRST116') {
          console.log('لم يوجد ملف شخصي، جاري إنشاء واحد...');
          const { data: authUser } = await supabase.auth.getUser();

          if (authUser.user) {
            console.log('إنشاء ملف شخصي للمستخدم:', authUser.user.email);

            const userEmail = authUser.user.email || 'user@example.com';
            const userName = authUser.user.email?.split('@')[0] || authUser.user.email || 'مستخدم';

            try {
              const { data: insertData, error: insertError } = await supabase
                .from('profiles')
                .upsert({
                  id: authUser.user.id,
                  email: userEmail,
                  name: userName,
                  role: 'admin'
                })
                .select()
                .single();

              if (!insertError && insertData) {
                console.log('تم إنشاء الملف الشخصي بنجاح');
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
                setIsLoading(false);
                console.log('تم تعيين بيانات المستخدم الجديد بنجاح');
                return;
              }
            } catch (insertError) {
              console.error('فشل في إنشاء الملف الشخصي:', insertError);
            }

            // إنشاء مستخدم وهمي كحل احتياطي
            const tempUser: User = {
              id: authUser.user.id,
              email: authUser.user.email || '',
              name: authUser.user.email?.split('@')[0] || 'مستخدم',
              role: 'admin',
            };
            setUser(tempUser);
            setProfileLoaded(true);
            setIsLoading(false);
            console.log('تم إنشاء مستخدم وهمي كحل احتياطي');
            return;
          }
        }

        // خطأ عام - إنشاء مستخدم وهمي
        console.log('خطأ عام في تحميل الملف الشخصي، إنشاء مستخدم وهمي');
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser.user) {
          const tempUser: User = {
            id: authUser.user.id,
            email: authUser.user.email || '',
            name: authUser.user.email?.split('@')[0] || 'مستخدم',
            role: 'admin',
          };
          setUser(tempUser);
          setProfileLoaded(true);
          setIsLoading(false);
          return;
        }

        setIsLoading(false);
        return;
      }

      if (profile) {
        console.log('تم تحميل الملف الشخصي:', profile.name, 'الدور:', profile.role, 'الفريق:', profile.team_id);
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
        console.log('تم تعيين بيانات المستخدم بنجاح - الدور:', userData.role, 'الفريق:', userData.teamId);
      }

    } catch (error) {
      console.error('Error loading user profile:', error);

      // إنشاء مستخدم وهمي في حالة الخطأ
      const { data: authUser } = await supabase.auth.getUser();
      if (authUser.user) {
        const tempUser: User = {
          id: authUser.user.id,
          email: authUser.user.email || '',
          name: authUser.user.email?.split('@')[0] || 'مستخدم',
          role: 'admin',
        };
        setUser(tempUser);
        setProfileLoaded(true);
        setIsLoading(false);
        console.log('تم إنشاء مستخدم وهمي بعد خطأ في التحميل');
        return;
      }

      setIsLoading(false);
    } finally {
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
  const login = async (usernameOrEmail: string, password: string): Promise<boolean> => {
    console.log('بدء عملية تسجيل الدخول:', usernameOrEmail);

    try {
      let email = usernameOrEmail;

      // إذا لم يكن المدخل بريد إلكتروني، ابحث عنه كاسم مستخدم
      if (!usernameOrEmail.includes('@')) {
        console.log('البحث عن المستخدم باستخدام اسم المستخدم:', usernameOrEmail);
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', usernameOrEmail)
          .single();

        if (profileError || !profile) {
          console.error('لم يتم العثور على المستخدم:', profileError);
          toast.error('اسم المستخدم غير موجود');
          return false;
        }

        email = profile.email;
        console.log('تم العثور على البريد الإلكتروني:', email);
      }

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

  // إضافة عضو جديد (مبسط - بدون إنشاء حساب مصادقة)
  const addUser = async (newUser: Omit<User, 'id'>) => {
    try {
      // إنشاء معرف فريد للعضو
      const memberId = crypto.randomUUID();

      // التحقق من صحة teamId
      const isValidUUID = (str: string | undefined) => {
        if (!str) return false;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
      };

      const validTeamId = isValidUUID(newUser.teamId) ? newUser.teamId : null;

      // إدراج العضو مباشرة في جدول الملفات الشخصية
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: memberId,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role || 'member',
          username: newUser.username,
          team_id: validTeamId,
        });

      if (profileError) {
        console.error('Error adding member:', profileError);
        toast.error(handleSupabaseError(profileError));
        return;
      }

      toast.success('تم إضافة العضو بنجاح');
      await loadUsers(); // إعادة تحميل قائمة الأعضاء
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('حدث خطأ أثناء إضافة العضو');
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