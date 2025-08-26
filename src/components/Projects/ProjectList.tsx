import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { Plus, Calendar, Users, BarChart } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ProjectModal } from './ProjectModal';

export const ProjectList: React.FC = () => {
  const { projects, teams, phases } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'مكتمل';
      case 'in-progress':
        return 'قيد التنفيذ';
      case 'on-hold':
        return 'متوقف';
      case 'planning':
        return 'تخطيط';
      default:
        return status;
    }
  };

  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team?.name || 'فريق غير معروف';
  };

  const getProjectPhasesCount = (projectId: string) => {
    return phases.filter(p => p.projectId === projectId).length;
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">المشاريع</h2>
          <p className="text-gray-600">إدارة مشاريعك وتتبع التقدم</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 space-x-reverse"
        >
          <Plus className="h-5 w-5" />
          <span>مشروع جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                {getStatusText(project.status)}
              </span>
            </div>
            
            <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
            
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 ml-2" />
                {format(project.startDate, 'dd MMM', { locale: ar })} - {format(project.endDate, 'dd MMM yyyy', { locale: ar })}
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <Users className="h-4 w-4 ml-2" />
                {getTeamName(project.teamId)}
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <BarChart className="h-4 w-4 ml-2" />
                {getProjectPhasesCount(project.id)} مرحلة
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <BarChart className="h-4 w-4 ml-2" />
                  التقدم
                </div>
                <span className="text-sm font-medium text-gray-900">{project.progress}%</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <ProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};