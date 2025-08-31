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
import { Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';

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
  { name: 'الإدارة المالية', href: '/page1', icon: FileText },
  { name: 'صفحة 2', href: '/page2', icon: FileText },
  { name: 'الإعدادات', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { settings } = useSettings();

  // فلترة القائمة حسب دور المستخدم
  const filteredNavigation = user?.role === 'member' && user?.teamId 
    ? navigation.filter(item => ['المهام', 'متتبع المهام', 'الإعدادات'].includes(item.name))
    : navigation;

  return (
    <div className="w-64 bg-white/95 backdrop-blur-sm shadow-strong h-full flex flex-col border-l border-accent-light/30">
      <div className="p-6 border-b border-accent-light/30 bg-gradient-to-br from-accent-light/20 to-accent-light/10">
        <div className="flex items-center space-x-3 space-x-reverse">
          {settings.logo && (
            <img 
              src={settings.logo} 
              alt="لوجو الشركة" 
              className="w-10 h-10 object-contain"
            />
          )}
          <div>
            <h1 className="text-lg font-bold gradient-text">{settings.name}</h1>
            <p className="text-sm text-accent-dark/80 mt-1">أهلاً، {user?.name}</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredNavigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-accent-light/40 to-accent-light/20 text-accent-dark border-r-3 border-accent-dark shadow-soft'
                      : 'text-accent-dark/70 hover:text-accent-dark hover:bg-accent-light/20'
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
      
      <div className="p-4 border-t border-accent-light/30 bg-gradient-to-br from-accent-light/10 to-transparent">
        <button
          onClick={logout}
          className="w-full flex items-center px-4 py-3 text-sm font-medium text-accent-dark/70 rounded-lg hover:text-accent-dark hover:bg-accent-light/20 transition-colors"
        >
          <LogOut className="ml-3 h-5 w-5" />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
};