import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  CheckSquare, 
  Target,
  BarChart3, 
  Calendar,
  UserCheck,
  LogOut,
  FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navigation = [
  { name: 'لوحة التحكم', href: '/', icon: LayoutDashboard },
  { name: 'المشاريع', href: '/projects', icon: FolderKanban },
  { name: 'الفرق', href: '/teams', icon: Users },
  { name: 'الأعضاء', href: '/members', icon: UserCheck },
  { name: 'المهام', href: '/tasks', icon: CheckSquare },
  { name: 'متتبع المهام', href: '/task-tracker', icon: Target },
  { name: 'مخطط جانت', href: '/gantt', icon: Calendar },
  { name: 'التحليلات', href: '/analytics', icon: BarChart3 },
  { name: 'التقارير', href: '/reports', icon: FileText },
];

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="w-64 bg-white shadow-lg h-full flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">إدارة المشاريع</h1>
        <p className="text-sm text-gray-600 mt-1">أهلاً، {user?.name}</p>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`
                }
              >
                <item.icon className="ml-3 h-5 w-5" />
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-600 rounded-lg hover:text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <LogOut className="ml-3 h-5 w-5" />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
};