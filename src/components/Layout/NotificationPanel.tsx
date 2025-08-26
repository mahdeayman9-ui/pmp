import React, { useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { Bell, X, Check, CheckCheck, Trash2, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export const NotificationPanel: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotification, 
    clearAllNotifications 
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'deadline':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'overdue':
        return 'border-r-red-500 bg-red-50';
      case 'deadline':
        return 'border-r-orange-500 bg-orange-50';
      case 'completed':
        return 'border-r-green-500 bg-green-50';
      default:
        return 'border-r-blue-500 bg-blue-50';
    }
  };

  return (
    <div className="relative">
      {/* زر الإشعارات */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-accent-dark/70 hover:text-accent-dark hover:bg-accent-light/20 rounded-lg transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center shadow-soft">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* لوحة الإشعارات */}
      {isOpen && (
        <>
          {/* خلفية شفافة للإغلاق */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* لوحة الإشعارات */}
          <div className="absolute left-0 mt-2 w-96 bg-white/95 backdrop-blur-sm rounded-xl shadow-strong border border-accent-light/30 z-50 max-h-96 overflow-hidden">
            {/* رأس اللوحة */}
            <div className="p-4 border-b border-accent-light/30 bg-gradient-to-r from-accent-light/20 to-accent-light/10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold gradient-text">الإشعارات</h3>
                <div className="flex items-center space-x-2 space-x-reverse">
                  {notifications.length > 0 && (
                    <>
                      <button
                        onClick={markAllAsRead}
                        className="text-sm text-accent-dark hover:text-accent-dark/80 flex items-center space-x-1 space-x-reverse"
                        title="تحديد الكل كمقروء"
                      >
                        <CheckCheck className="h-4 w-4" />
                      </button>
                      <button
                        onClick={clearAllNotifications}
                        className="text-sm text-red-600 hover:text-red-800 flex items-center space-x-1 space-x-reverse"
                        title="حذف جميع الإشعارات"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-accent-dark/70 hover:text-accent-dark"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* قائمة الإشعارات */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-12 w-12 text-accent-dark/30 mx-auto mb-3" />
                  <p className="text-accent-dark/70">لا توجد إشعارات</p>
                </div>
              ) : (
                <div className="divide-y divide-accent-light/20">
                  {notifications
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-r-4 ${getNotificationColor(notification.type)} ${
                        !notification.read ? 'bg-opacity-100' : 'bg-opacity-50'
                      } hover:bg-opacity-75 transition-colors`}
                    >
                      <div className="flex items-start space-x-3 space-x-reverse">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className={`text-sm font-medium ${
                                !notification.read ? 'text-accent-dark' : 'text-accent-dark/70'
                              }`}>
                                {notification.title}
                              </h4>
                              <p className={`text-sm mt-1 ${
                                !notification.read ? 'text-accent-dark/80' : 'text-accent-dark/60'
                              }`}>
                                {notification.message}
                              </p>
                              <p className="text-xs text-accent-dark/50 mt-2">
                                {format(notification.timestamp, 'dd MMM yyyy، HH:mm', { locale: ar })}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1 space-x-reverse ml-2">
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-accent-dark/60 hover:text-accent-dark"
                                  title="تحديد كمقروء"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => clearNotification(notification.id)}
                                className="text-red-500 hover:text-red-700"
                                title="حذف الإشعار"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};