import React, { useEffect, useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = React.memo(({ children }) => {
  const { user, isLoading } = useAuth();
  const [timeoutReached, setTimeoutReached] = useState(false);

  // تحسين: تقليل console.log واستخدام useMemo للوقاية من إعادة الرسم غير الضرورية
  const shouldRedirect = useMemo(() => {
    return timeoutReached || (!isLoading && !user);
  }, [timeoutReached, isLoading, user]);

  // إضافة timeout للتحميل - محسّن
  useEffect(() => {
    if (!isLoading) return; // لا نحتاج للـ timeout إذا لم نكن نتحمّل

    const timer = setTimeout(() => {
      console.log('انتهت مهلة التحميل، إعادة توجيه لتسجيل الدخول');
      setTimeoutReached(true);
    }, 10000); // 10 ثواني

    return () => clearTimeout(timer);
  }, [isLoading]);

  // إعادة تعيين timeout عند تغيير حالة التحميل
  useEffect(() => {
    if (!isLoading) {
      setTimeoutReached(false);
    }
  }, [isLoading]);

  // إذا انتهت المهلة أو لا يوجد مستخدم
  if (shouldRedirect) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent-light/30 via-accent-light/20 to-accent-dark/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-accent-light border-t-accent-dark mx-auto mb-4" />
          <p className="text-accent-dark font-medium">جاري التحميل...</p>
          <p className="text-accent-dark/70 text-sm mt-2">يرجى الانتظار</p>
        </div>
      </div>
    );
  }

  // إزالة console.log المفرط لتحسين الأداء
  return <>{children}</>;
});