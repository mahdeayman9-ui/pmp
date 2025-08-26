import React from 'react';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const [showTimeout, setShowTimeout] = useState(false);

  // Show timeout message after 15 seconds
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setShowTimeout(true);
      }, 15000);
      
      return () => clearTimeout(timer);
    } else {
      setShowTimeout(false);
    }
  }, [isLoading]);

  // Debug logging
  useEffect(() => {
    console.log('ProtectedRoute - User:', user ? 'موجود' : 'غير موجود');
    console.log('ProtectedRoute - Loading:', isLoading);
    
    // إذا كان المستخدم موجود ولكن لا يزال في حالة تحميل، أوقف التحميل
    if (user && isLoading) {
      console.log('المستخدم موجود ولكن isLoading لا يزال true، سيتم إيقاف التحميل');
      // هذا سيتم التعامل معه في AuthContext
    }
  }, [user, isLoading]);
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">جاري التحميل...</p>
          {showTimeout && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">التحميل يستغرق وقتاً أطول من المعتاد...</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                إعادة تحميل الصفحة
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute - توجيه إلى صفحة تسجيل الدخول');
    return <Navigate to="/login" replace />;
  }

  console.log('ProtectedRoute - عرض المحتوى المحمي');
  return <>{children}</>;
};