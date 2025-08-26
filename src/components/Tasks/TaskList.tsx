import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Plus, Filter, Calendar, User, AlertTriangle, Clock, Target } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { TaskModal } from './TaskModal';

export const TaskList: React.FC = () => {
  const { tasks, projects, teams, getTaskRiskLevel, calculateTaskProgress } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  const filteredTasks = tasks.filter(task => {
    const statusMatch = statusFilter === 'all' || task.status === statusFilter;
    const priorityMatch = priorityFilter === 'all' || task.priority === priorityFilter;
    const assigneeMatch = assigneeFilter === 'all' || task.assignedToUserId === assigneeFilter;
    return statusMatch && priorityMatch && assigneeMatch;
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

  const getRiskText = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'حرجة';
      case 'high':
        return 'عالية';
      case 'medium':
        return 'متوسطة';
      case 'low':
        return 'منخفضة';
      default:
        return riskLevel;
    }
  };

  const getProjectAndPhase = (projectId: string, phaseId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return 'مشروع غير معروف';
    
    const phase = project.phases.find(ph => ph.id === phaseId);
    return `${project.name} - ${phase?.name || 'مرحلة غير معروفة'}`;
  };

  const allMembers = teams.flatMap(team => 
    team.members.map(member => ({
      id: member.userId,
      name: member.name,
      teamName: team.name
    }))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">المهام</h2>
          <p className="text-gray-600">إدارة وتتبع جميع مهامك</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 space-x-reverse"
        >
          <Plus className="h-5 w-5" />
          <span>مهمة جديدة</span>
        </button>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">إجمالي المهام</p>
              <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
            </div>
            <Target className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">قيد التنفيذ</p>
              <p className="text-2xl font-bold text-blue-600">
                {tasks.filter(t => t.status === 'in-progress').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">مكتملة</p>
              <p className="text-2xl font-bold text-green-600">
                {tasks.filter(t => t.status === 'completed').length}
              </p>
            </div>
            <div className="h-8 w-8 text-green-500">✅</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">متأخرة</p>
              <p className="text-2xl font-bold text-red-600">
                {tasks.filter(t => t.isOverdue).length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* الفلاتر */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">فلترة حسب:</span>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">جميع الحالات</option>
            <option value="todo">لم تبدأ</option>
            <option value="in-progress">قيد التنفيذ</option>
            <option value="completed">مكتملة</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">جميع الأولويات</option>
            <option value="high">عالية</option>
            <option value="medium">متوسطة</option>
            <option value="low">منخفضة</option>
          </select>

          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">جميع الأعضاء</option>
            {allMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>

          {(statusFilter !== 'all' || priorityFilter !== 'all' || assigneeFilter !== 'all') && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
                setAssigneeFilter('all');
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              مسح الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* قائمة المهام */}
      <div className="space-y-4">
        {filteredTasks.map((task) => {
          const progress = calculateTaskProgress(task);
          const riskLevel = getTaskRiskLevel(task);
          
          return (
            <div
              key={task.id}
              className={`bg-white rounded-lg shadow-sm border-2 p-6 hover:shadow-md transition-shadow ${getRiskColor(riskLevel)}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 space-x-reverse mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                      {getStatusText(task.status)}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                      أولوية {getPriorityText(task.priority)}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRiskColor(riskLevel)}`}>
                      مخاطر {getRiskText(riskLevel)}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{task.description}</p>
                  <div className="text-sm text-gray-500">
                    <span>{getProjectAndPhase(task.projectId, task.phaseId)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 ml-2" />
                  <span>
                    {format(task.startDate, 'dd MMM', { locale: ar })} - {format(task.endDate, 'dd MMM yyyy', { locale: ar })}
                  </span>
                </div>
                
                <div className="flex items-center text-sm text-gray-500">
                  <User className="h-4 w-4 ml-2" />
                  <span>{task.assignedToName || 'غير مُكلف'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">التقدم</span>
                  <span className="text-sm font-medium text-gray-900">{progress}%</span>
                </div>
              </div>

              {/* شريط التقدم */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    progress === 100 ? 'bg-green-500' : 
                    progress >= 75 ? 'bg-blue-500' : 
                    progress >= 50 ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* معلومات إضافية */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4 space-x-reverse">
                  {task.totalTarget && (
                    <span>الهدف: {task.totalTarget}</span>
                  )}
                  {task.dailyAchievements && task.dailyAchievements.length > 0 && (
                    <span>الإنجازات: {task.dailyAchievements.length}</span>
                  )}
                  {task.actualStartDate && (
                    <span>بدأت: {format(task.actualStartDate, 'dd MMM', { locale: ar })}</span>
                  )}
                </div>
                <div>
                  {task.lastActivity && (
                    <span>آخر نشاط: {format(task.lastActivity, 'dd MMM، HH:mm', { locale: ar })}</span>
                  )}
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
            {statusFilter !== 'all' || priorityFilter !== 'all' || assigneeFilter !== 'all'
              ? 'لا توجد مهام تطابق الفلاتر المحددة'
              : 'ابدأ بإنشاء مهمة جديدة لتتبع تقدمك'
            }
          </p>
          {(statusFilter !== 'all' || priorityFilter !== 'all' || assigneeFilter !== 'all') && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
                setAssigneeFilter('all');
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