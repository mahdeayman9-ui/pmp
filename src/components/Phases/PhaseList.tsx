import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Plus, Calendar, BarChart, Users, Clock, Target, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { PhaseModal } from './PhaseModal';
import { PhaseCard } from './PhaseCard';

export const PhaseList: React.FC = () => {
  const { projects, phases, tasks, teams } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedPhase, setSelectedPhase] = useState(null);

  // فلترة المراحل حسب المشروع المحدد
  const filteredPhases = selectedProjectId 
    ? phases.filter(phase => phase.projectId === selectedProjectId)
    : phases;

  // حساب إحصائيات المراحل
  const phaseStats = {
    total: filteredPhases.length,
    completed: filteredPhases.filter(p => p.status === 'completed').length,
    inProgress: filteredPhases.filter(p => p.status === 'in-progress').length,
    notStarted: filteredPhases.filter(p => p.status === 'not-started').length,
    overdue: filteredPhases.filter(p => {
      const today = new Date();
      return new Date(p.endDate) < today && p.status !== 'completed';
    }).length
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'مشروع غير معروف';
  };

  const getPhaseTasksCount = (phaseId: string) => {
    return tasks.filter(t => t.phaseId === phaseId).length;
  };

  const getPhaseCompletedTasks = (phaseId: string) => {
    return tasks.filter(t => t.phaseId === phaseId && t.status === 'completed').length;
  };

  const handleEditPhase = (phase: any) => {
    setSelectedPhase(phase);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPhase(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">مراحل المشاريع</h2>
          <p className="text-gray-600">إدارة وتتبع مراحل المشاريع المختلفة</p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">جميع المشاريع</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={!selectedProjectId}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-5 w-5" />
            <span>مرحلة جديدة</span>
          </button>
        </div>
      </div>

      {/* إحصائيات المراحل */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">إجمالي المراحل</p>
              <p className="text-2xl font-bold text-gray-900">{phaseStats.total}</p>
            </div>
            <Target className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">مكتملة</p>
              <p className="text-2xl font-bold text-green-600">{phaseStats.completed}</p>
            </div>
            <div className="h-8 w-8 text-green-500">✅</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">قيد التنفيذ</p>
              <p className="text-2xl font-bold text-blue-600">{phaseStats.inProgress}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">لم تبدأ</p>
              <p className="text-2xl font-bold text-gray-600">{phaseStats.notStarted}</p>
            </div>
            <div className="h-8 w-8 text-gray-500">⏳</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">متأخرة</p>
              <p className="text-2xl font-bold text-red-600">{phaseStats.overdue}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* قائمة المراحل */}
      <div className="space-y-4">
        {filteredPhases.length > 0 ? (
          filteredPhases.map((phase) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              projectName={getProjectName(phase.projectId)}
              tasksCount={getPhaseTasksCount(phase.id)}
              completedTasksCount={getPhaseCompletedTasks(phase.id)}
              onEdit={handleEditPhase}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedProjectId ? 'لا توجد مراحل لهذا المشروع' : 'لا توجد مراحل'}
            </h3>
            <p className="text-gray-500 mb-4">
              {selectedProjectId 
                ? 'ابدأ بإضافة مراحل لهذا المشروع لتنظيم العمل'
                : 'اختر مشروعاً وابدأ بإضافة مراحل له'
              }
            </p>
            {selectedProjectId && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                إضافة مرحلة جديدة
              </button>
            )}
          </div>
        )}
      </div>

      <PhaseModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        projectId={selectedProjectId}
        phase={selectedPhase}
      />
    </div>
  );
};