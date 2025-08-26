import React from 'react';
import { Calendar, BarChart, Users, Clock, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useData } from '../../contexts/DataContext';

interface PhaseCardProps {
  phase: any;
  projectName: string;
  tasksCount: number;
  completedTasksCount: number;
  onEdit: (phase: any) => void;
}

export const PhaseCard: React.FC<PhaseCardProps> = ({
  phase,
  projectName,
  tasksCount,
  completedTasksCount,
  onEdit
}) => {
  const { deletePhase } = useData();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'not-started':
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
      case 'not-started':
        return 'لم تبدأ';
      default:
        return status;
    }
  };

  const isOverdue = () => {
    const today = new Date();
    return new Date(phase.endDate) < today && phase.status !== 'completed';
  };

  const completionRate = tasksCount > 0 ? Math.round((completedTasksCount / tasksCount) * 100) : 0;

  const handleDelete = () => {
    if (window.confirm(`هل أنت متأكد من حذف المرحلة "${phase.name}"؟`)) {
      deletePhase(phase.id);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border-2 p-6 hover:shadow-md transition-shadow ${
      isOverdue() ? 'border-red-300 bg-red-50' : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 space-x-reverse mb-2">
            <h3 className="text-xl font-semibold text-gray-900">{phase.name}</h3>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(phase.status)}`}>
              {getStatusText(phase.status)}
            </span>
            {isOverdue() && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                متأخرة
              </span>
            )}
          </div>
          <p className="text-gray-600 mb-3">{phase.description}</p>
          <div className="text-sm text-gray-500 mb-2">
            <span className="font-medium">المشروع:</span> {projectName}
          </div>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={() => onEdit(phase)}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit className="h-5 w-5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="h-4 w-4 ml-2" />
          <span>
            {format(phase.startDate, 'dd MMM', { locale: ar })} - {format(phase.endDate, 'dd MMM yyyy', { locale: ar })}
          </span>
        </div>
        
        <div className="flex items-center text-sm text-gray-500">
          <Users className="h-4 w-4 ml-2" />
          <span>{tasksCount} مهمة ({completedTasksCount} مكتملة)</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <BarChart className="h-4 w-4 ml-2" />
            <span>التقدم</span>
          </div>
          <span className="text-sm font-medium text-gray-900">{phase.progress}%</span>
        </div>
      </div>

      {/* شريط التقدم */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
        <div
          className={`h-3 rounded-full transition-all duration-300 ${
            phase.progress === 100 ? 'bg-green-500' : 
            phase.progress >= 75 ? 'bg-blue-500' : 
            phase.progress >= 50 ? 'bg-yellow-500' : 
            'bg-red-500'
          }`}
          style={{ width: `${phase.progress}%` }}
        />
      </div>

      {/* معلومات إضافية */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4 space-x-reverse">
          <span>معدل إكمال المهام: {completionRate}%</span>
          {phase.status === 'in-progress' && (
            <span className="text-blue-600">نشطة</span>
          )}
        </div>
        <div>
          <span>تم الإنشاء: {format(phase.createdAt || new Date(), 'dd MMM yyyy', { locale: ar })}</span>
        </div>
      </div>
    </div>
  );
};