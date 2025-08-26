import React from 'react';
import { useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { NotificationPanel } from './NotificationPanel';
import { useSettings } from '../../contexts/SettingsContext';

const pageNames: { [key: string]: string } = {
  '/': 'لوحة التحكم',
  '/projects': 'المشاريع',
  '/phases': 'مراحل المشاريع',
  '/teams': 'الفرق',
  '/members': 'الأعضاء',
  '/tasks': 'المهام',
  '/task-tracker': 'متتبع المهام',
  '/gantt': 'مخطط جانت',
  '/analytics': 'التحليلات',
  '/reports': 'التقارير',
  '/settings': 'الإعدادات',
};

export const Header: React.FC = () => {
  const location = useLocation();
  const { settings } = useSettings();
  const currentPage = pageNames[location.pathname] || 'الصفحة';

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-soft border-b border-accent-light/30">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            {settings.logo && (
              <img 
                src={settings.logo} 
                alt="لوجو الشركة" 
                className="w-12 h-12 object-contain"
              />
            )}
            <div>
              <h1 className="text-2xl font-semibold gradient-text">{currentPage}</h1>
              <p className="text-sm text-accent-dark/80 mt-1">
                {settings.name} - إدارة مشاريعك وفرقك بفعالية
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-accent-dark/60 h-5 w-5" />
              <input
                type="text"
                placeholder="بحث..."
                className="input-professional pr-10 pl-4 py-2 w-80"
              />
            </div>
            
            <NotificationPanel />
          </div>
        </div>
      </div>
    </header>
  );
};