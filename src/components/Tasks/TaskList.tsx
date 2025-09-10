import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Filter, Calendar, User, AlertTriangle, Clock, Target } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { TaskModal } from './TaskModal';
import { canUpdateTasks } from '../../utils/permissions';

export const TaskList: React.FC = () => {
  const { tasks, projects, getTaskRiskLevel, calculateTaskProgress, getAllTeams } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');

  // فلترة المهام حسب المستخدم
  let userFilteredTasks = tasks;
  if (user?.role === 'member' && user?.teamId) {
    userFilteredTasks = tasks.filter(task => task.assignedToTeamId === user.teamId);
  }

  const filteredTasks = userFilteredTasks.filter(task => {
    const statusMatch = statusFilter === 'all' || task.status === statusFilter;
    const priorityMatch = priorityFilter === 'all' || task.priority === priorityFilter;
    const teamMatch = teamFilter === 'all' || task.assignedToTeamId === teamFilter;
    return statusMatch && priorityMatch && teamMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'todo':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'مكتملة';
      case 'in-progress':
        return 'قيد التنفيذ';
      case 'todo':
        return 'لم تبدأ';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'عالية';
      case 'medium':
        return 'متوسطة';
      case 'low':
        return 'منخفضة';
      default:
        return priority;
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };


  const getProjectAndPhase = (projectId: string, phaseId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return 'مشروع غير معروف';
    
    const phase = project.phases.find(ph => ph.id === phaseId);
    return `${project.name} - ${phase?.name || 'مرحلة غير معروفة'}`;
  };

  const allTeams = getAllTeams();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">المهام</h2>
          <p className="text-gray-600">إدارة وتتبع جميع مهامك</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={!canUpdateTasks(user?.teamId)}
          className="btn-primary px-4 py-2 flex items-center space-x-2 space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed"
          title={!canUpdateTasks(user?.teamId) ? 'ليس لديك صلاحية إضافة مهام' : ''}
        >
          <Plus className="h-5 w-5" />
          <span>مهمة جديدة</span>
        </button>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-professional p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-accent-dark/80">إجمالي المهام</p>
              <p className="text-2xl font-bold gradient-text">{userFilteredTasks.length}</p>
            </div>
            <Target className="h-8 w-8 text-accent-dark" />
          </div>
        </div>
        <div className="card-professional p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-accent-dark/80">قيد التنفيذ</p>
              <p className="text-2xl font-bold text-accent-dark">
                {userFilteredTasks.filter(t => t.status === 'in-progress').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-accent-dark" />
          </div>
        </div>
        <div className="card-professional p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-accent-dark/80">مكتملة</p>
              <p className="text-2xl font-bold text-green-600">
                {userFilteredTasks.filter(t => t.status === 'completed').length}
              </p>
            </div>
            <div className="h-8 w-8 text-green-500">✅</div>
          </div>
        </div>
        <div className="card-professional p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-accent-dark/80">متأخرة</p>
              <p className="text-2xl font-bold text-red-600">
                {userFilteredTasks.filter(t => t.isOverdue).length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* الفلاتر */}
      <div className="card-professional p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Filter className="h-5 w-5 text-accent-dark/70" />
            <span className="text-sm font-medium text-accent-dark">فلترة حسب:</span>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select-professional px-3 py-1 text-sm"
          >
            <option value="all">جميع الحالات</option>
            <option value="todo">لم تبدأ</option>
            <option value="in-progress">قيد التنفيذ</option>
            <option value="completed">مكتملة</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="select-professional px-3 py-1 text-sm"
          >
            <option value="all">جميع الأولويات</option>
            <option value="high">عالية</option>
            <option value="medium">متوسطة</option>
            <option value="low">منخفضة</option>
          </select>

          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="select-professional px-3 py-1 text-sm"
          >
            <option value="all">جميع الفرق</option>
            {allTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>

          {(statusFilter !== 'all' || priorityFilter !== 'all' || teamFilter !== 'all') && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
                setTeamFilter('all');
              }}
              className="text-sm text-accent-dark hover:text-accent-dark/80"
            >
              مسح الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* قائمة المهام - عرض شريطي عمودي */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTasks.map((task) => {
          const progress = calculateTaskProgress(task);
          const riskLevel = getTaskRiskLevel(task);

          return (
            <div
              key={task.id}
              onClick={() => navigate(`/task-tracker/${task.id}`)}
              className={`bg-white rounded-lg shadow-sm border-2 p-4 hover:shadow-md transition-all duration-200 cursor-pointer ${getRiskColor(riskLevel)}`}
            >
              {/* العنوان والحالة */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                    {getStatusText(task.status)}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                    {getPriorityText(task.priority)}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
                  {task.title}
                </h3>
              </div>

              {/* الفريق المسؤول */}
              <div className="flex items-center text-xs text-gray-600 mb-3">
                <User className="h-3 w-3 ml-1" />
                <span className="truncate">{task.assignedToTeamName || 'غير مُكلف'}</span>
              </div>

              {/* التواريخ */}
              <div className="text-xs text-gray-500 mb-3">
                <div className="flex items-center mb-1">
                  <Calendar className="h-3 w-3 ml-1" />
                  <span>{format(task.startDate, 'dd/MM', { locale: ar })} - {format(task.endDate, 'dd/MM', { locale: ar })}</span>
                </div>
              </div>

              {/* شريط التقدم */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>التقدم</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      progress === 100 ? 'bg-green-500' :
                      progress >= 75 ? 'bg-blue-500' :
                      progress >= 50 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* المشروع والمرحلة */}
              <div className="text-xs text-gray-500 border-t pt-2">
                <div className="truncate">
                  {getProjectAndPhase(task.projectId, task.phaseId)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* حالة فارغة */}
      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد مهام</h3>
          <p className="text-gray-500 mb-4">
            {statusFilter !== 'all' || priorityFilter !== 'all' || teamFilter !== 'all'
              ? 'لا توجد مهام تطابق الفلاتر المحددة'
              : 'ابدأ بإنشاء مهمة جديدة لتتبع تقدمك'
            }
          </p>
          {(statusFilter !== 'all' || priorityFilter !== 'all' || teamFilter !== 'all') && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
                setTeamFilter('all');
              }}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              مسح جميع الفلاتر
            </button>
          )}
        </div>
      )}

      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};