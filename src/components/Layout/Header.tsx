import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';

const pageNames: { [key: string]: string } = {
  '/': 'لوحة التحكم',
  '/projects': 'المشاريع',
  '/teams': 'الفرق',
  '/members': 'الأعضاء',
  '/tasks': 'المهام',
  '/task-tracker': 'متتبع المهام',
  '/gantt': 'مخطط جانت',
  '/analytics': 'التحليلات',
};

export const Header: React.FC = () => {
  const location = useLocation();
  const currentPage = pageNames[location.pathname] || 'الصفحة';

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{currentPage}</h1>
            <p className="text-sm text-gray-600 mt-1">
              إدارة مشاريعك وفرقك بفعالية
            </p>
          </div>
          
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="بحث..."
                className="pr-10 pl-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};