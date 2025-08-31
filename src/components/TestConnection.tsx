import React, { useState } from 'react';
import { testDatabaseConnection, createTestUser } from '../utils/testConnection';

export const TestConnection: React.FC = () => {
  console.log('=== TestConnection component loaded ===');

  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');

  console.log('Component state initialized');

  const runConnectionTest = async () => {
    console.log('=== Starting connection test ===');
    alert('Starting connection test - check console');
    setIsLoading(true);

    try {
      // First, check environment variables
      console.log('Environment check:');
      console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
      console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');

      const results = await testDatabaseConnection();
      setTestResults(results);
      console.log('نتائج اختبار الاتصال:', results);
      alert('Connection test complete - check console and results below');
    } catch (error) {
      console.error('خطأ في الاختبار:', error);
      setTestResults({ error: error instanceof Error ? error.message : 'Unknown error' });
      alert('Connection test failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const createUser = async () => {
    console.log('=== Starting user creation ===');
    console.log('Email:', email, 'Password length:', password.length);

    setIsLoading(true);
    try {
      const results = await createTestUser(email, password);
      setTestResults(results);
      console.log('نتائج إنشاء المستخدم:', results);

      // Also run connection test after user creation
      setTimeout(async () => {
        console.log('Running connection test after user creation...');
        const connectionResults = await testDatabaseConnection();
        console.log('Connection test after user creation:', connectionResults);
        setTestResults((prev: any) => ({ ...prev, connectionAfterCreation: connectionResults }));
      }, 2000);

    } catch (error) {
      console.error('خطأ في إنشاء المستخدم:', error);
      setTestResults({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  };

  console.log('Rendering TestConnection component');

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded">
        <h2 className="text-lg font-semibold text-green-800">✅ الصفحة تعمل بشكل صحيح</h2>
        <p className="text-green-700">Component loaded successfully at {new Date().toLocaleTimeString()}</p>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">اختبار الاتصال بقاعدة البيانات</h1>
        <p className="text-gray-600 mb-4">
          هذه الصفحة تساعد في تشخيص مشاكل تسجيل الدخول والتحقق من حالة قاعدة البيانات
        </p>
        <a
          href="/login"
          className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm mr-4"
        >
          العودة لصفحة تسجيل الدخول ←
        </a>
        <button
          onClick={() => {
            console.log('Manual console test - current time:', new Date().toISOString());
            alert('Console test executed - check console for timestamp');
          }}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm"
        >
          اختبار وحدة التحكم
        </button>

        <button
          onClick={() => alert('Button works! Basic functionality is OK.')}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm ml-2"
        >
          اختبار الزر الأساسي
        </button>

        <button
          onClick={async () => {
            try {
              console.log('=== Checking current auth status ===');
              alert('Button clicked - checking console for auth status');

              const supabaseModule = await import('../lib/supabase');
              const { data: user, error: userError } = await supabaseModule.supabase.auth.getUser();
              console.log('Current user:', user, 'Error:', userError);

              const { data: session, error: sessionError } = await supabaseModule.supabase.auth.getSession();
              console.log('Current session:', session, 'Error:', sessionError);

              alert('Auth check complete - check console');
            } catch (error) {
              console.error('Auth check failed:', error);
              alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
            }
          }}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 text-sm ml-2"
        >
          فحص حالة المصادقة
        </button>
      </div>

      <div className="space-y-4 mb-6">
        <button
          onClick={runConnectionTest}
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'جاري الاختبار...' : 'اختبار الاتصال'}
        </button>

        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold mb-2">إنشاء مستخدم اختبار</h2>
          <div className="flex gap-2 mb-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="البريد الإلكتروني"
              className="border px-3 py-2 rounded"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              className="border px-3 py-2 rounded"
            />
            <button
              onClick={createUser}
              disabled={isLoading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {isLoading ? 'جاري الإنشاء...' : 'إنشاء مستخدم'}
            </button>
          </div>
        </div>
      </div>

      {testResults && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">النتائج:</h2>
          <pre className="text-sm overflow-auto max-h-96">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-100 border border-yellow-300 rounded">
        <h3 className="font-semibold">تعليمات الاستخدام:</h3>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>اضغط على "اختبار الاتصال" لرؤية حالة قاعدة البيانات</li>
          <li>إذا لم يكن هناك مستخدمين، أنشئ مستخدماً اختبارياً</li>
          <li>تحقق من وحدة التحكم في المتصفح (F12) لرؤية الرسائل التفصيلية</li>
          <li>بعد إنشاء المستخدم، جرب تسجيل الدخول بالبيانات الجديدة</li>
        </ol>
      </div>
    </div>
  );
};