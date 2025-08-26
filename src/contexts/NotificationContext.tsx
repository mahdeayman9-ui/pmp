import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useData } from './DataContext';
import { Bell, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface Notification {
  id: string;
  type: 'overdue' | 'deadline' | 'completed' | 'reminder';
  title: string;
  message: string;
  taskId?: string;
  projectId?: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { tasks, projects } = useData();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // فحص المهام المتأخرة والمواعيد النهائية
  useEffect(() => {
    const checkTasks = () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      tasks.forEach(task => {
        const endDate = new Date(task.endDate);
        const project = projects.find(p => p.id === task.projectId);

        // مهام متأخرة
        if (endDate < today && task.status !== 'completed') {
          const existingNotification = notifications.find(
            n => n.taskId === task.id && n.type === 'overdue'
          );

          if (!existingNotification) {
            const notification: Notification = {
              id: `overdue-${task.id}-${Date.now()}`,
              type: 'overdue',
              title: 'مهمة متأخرة',
              message: `المهمة "${task.title}" في مشروع "${project?.name}" متأخرة`,
              taskId: task.id,
              projectId: task.projectId,
              timestamp: new Date(),
              read: false
            };

            setNotifications(prev => [...prev, notification]);
            
            toast.error(notification.message, {
              icon: <AlertTriangle className="h-5 w-5" />,
              duration: 5000,
            });
          }
        }

        // مهام تنتهي غداً
        if (endDate.toDateString() === tomorrow.toDateString() && task.status !== 'completed') {
          const existingNotification = notifications.find(
            n => n.taskId === task.id && n.type === 'deadline'
          );

          if (!existingNotification) {
            const notification: Notification = {
              id: `deadline-${task.id}-${Date.now()}`,
              type: 'deadline',
              title: 'موعد نهائي قريب',
              message: `المهمة "${task.title}" تنتهي غداً`,
              taskId: task.id,
              projectId: task.projectId,
              timestamp: new Date(),
              read: false
            };

            setNotifications(prev => [...prev, notification]);
            
            toast.warning(notification.message, {
              icon: <Clock className="h-5 w-5" />,
              duration: 4000,
            });
          }
        }

        // مهام مكتملة
        if (task.status === 'completed' && task.actualEndDate) {
          const completedToday = new Date(task.actualEndDate).toDateString() === today.toDateString();
          
          if (completedToday) {
            const existingNotification = notifications.find(
              n => n.taskId === task.id && n.type === 'completed'
            );

            if (!existingNotification) {
              const notification: Notification = {
                id: `completed-${task.id}-${Date.now()}`,
                type: 'completed',
                title: 'مهمة مكتملة',
                message: `تم إكمال المهمة "${task.title}" بنجاح`,
                taskId: task.id,
                projectId: task.projectId,
                timestamp: new Date(),
                read: false
              };

              setNotifications(prev => [...prev, notification]);
              
              toast.success(notification.message, {
                icon: <CheckCircle className="h-5 w-5" />,
                duration: 3000,
              });
            }
          }
        }
      });
    };

    // فحص فوري
    checkTasks();

    // فحص كل 30 دقيقة
    const interval = setInterval(checkTasks, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [tasks, projects, notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAllNotifications
    }}>
      {children}
      <Toaster 
        position="top-left"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#333',
            border: '1px solid #b4e1e6',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(95, 151, 157, 0.15)',
          },
        }}
      />
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};