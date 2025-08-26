import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';

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
};

export const Header: React.FC = () => {
  const location = useLocation();
  const currentPage = pageNames[location.pathname] || 'الصفحة';

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-soft border-b border-accent-light/30">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold gradient-text">{currentPage}</h1>
            <p className="text-sm text-accent-dark/80 mt-1">
              إدارة مشاريعك وفرقك بفعالية
            </p>
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
            
            <button className="relative p-2 text-accent-dark/70 hover:text-accent-dark hover:bg-accent-light/20 rounded-lg transition-colors">
              <Bell className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center shadow-soft">
                3
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};