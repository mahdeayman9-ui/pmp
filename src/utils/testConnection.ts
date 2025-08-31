import { supabase } from '../lib/supabase';

export const testDatabaseConnection = async () => {
  try {
    console.log('=== اختبار الاتصال بقاعدة البيانات ===');

    // اختبار الاتصال الأساسي
    const { data: authUser, error: authError } = await supabase.auth.getUser();
    console.log('حالة المصادقة:', { user: authUser.user?.email, error: authError?.message });

    // اختبار قراءة الجداول
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    console.log('ملفات الشخصية الموجودة:', { count: profiles?.length, error: profilesError?.message });

    // اختبار قراءة الشركات
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*');

    console.log('الشركات الموجودة:', { count: companies?.length, error: companiesError?.message });

    return {
      auth: { user: authUser.user, error: authError },
      profiles: { data: profiles, error: profilesError },
      companies: { data: companies, error: companiesError }
    };

  } catch (error) {
    console.error('خطأ في اختبار الاتصال:', error);
    return { error };
  }
};

export const createTestUser = async (email: string, password: string) => {
  try {
    console.log('=== إنشاء مستخدم اختبار ===');

    // إنشاء حساب المصادقة
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    console.log('نتيجة إنشاء حساب المصادقة:', {
      user: authData.user?.email,
      error: authError?.message
    });

    if (authError) {
      return { success: false, error: authError };
    }

    // انتظار لحظة ثم محاولة إنشاء الملف الشخصي
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (authData.user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email || '',
          name: authData.user.email?.split('@')[0] || 'مستخدم اختبار',
          role: 'admin'
        })
        .select()
        .single();

      console.log('نتيجة إنشاء الملف الشخصي:', {
        profile: profileData,
        error: profileError?.message
      });

      return {
        success: !profileError,
        auth: authData,
        profile: profileData,
        error: profileError
      };
    }

    return { success: false, auth: authData };

  } catch (error) {
    console.error('خطأ في إنشاء المستخدم:', error);
    return { success: false, error };
  }
};