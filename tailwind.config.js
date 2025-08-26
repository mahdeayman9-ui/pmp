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
  FileText,
  GitBranch
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navigation = [
  { name: 'لوحة التحكم', href: '/', icon: LayoutDashboard },
  { name: 'المشاريع', href: '/projects', icon: FolderKanban },
  { name: 'مراحل المشاريع', href: '/phases', icon: GitBranch },
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

  // فلترة القائمة حسب دور المستخدم
  const filteredNavigation = user?.role === 'member' && user?.teamId 
    ? navigation.filter(item => ['المهام', 'متتبع المهام'].includes(item.name))
    : navigation;

  return (
    <div className="w-64 bg-gradient-to-b from-white to-primary-50 shadow-strong h-full flex flex-col border-l border-primary-200">
      <div className="p-6 border-b border-primary-200 bg-gradient-to-r from-primary-500 to-primary-600">
        <h1 className="text-xl font-bold text-white">إدارة المشاريع</h1>
        <p className="text-sm text-primary-100 mt-1">أهلاً، {user?.name}</p>
      </div>
      
      <nav className="flex-1 p-4">
        },
        accent: {
          light: '#b4e1e6',
          dark: '#5f979d',
        }
          {filteredNavigation.map((item) => (
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
        'soft': '0 2px 15px -3px rgba(95, 151, 157, 0.12), 0 10px 20px -2px rgba(95, 151, 157, 0.06)',
        'medium': '0 4px 25px -5px rgba(95, 151, 157, 0.18), 0 10px 20px -5px rgba(95, 151, 157, 0.1)',
        'strong': '0 10px 40px -10px rgba(95, 151, 157, 0.3), 0 20px 25px -5px rgba(95, 151, 157, 0.15)',
        'glow': '0 0 20px rgba(180, 225, 230, 0.4)',
        </button>
      </div>
    </div>
  );
};