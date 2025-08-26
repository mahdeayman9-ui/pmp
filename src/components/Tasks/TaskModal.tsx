import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { addDays } from 'date-fns';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose }) => {
  const { projects, phases, addTask, getAllTeams } = useData();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    phaseId: '',
    projectId: '',
    assignedToTeamId: '',
    priority: 'medium',
    startDate: new Date().toISOString().split('T')[0],
    endDate: addDays(new Date(), 7).toISOString().split('T')[0],
  });

  const allTeams = getAllTeams();

  // Get available phases based on selected project
  const availablePhases = formData.projectId 
    ? phases.filter(p => p.projectId === formData.projectId)
    : [];

  const handleProjectChange = (projectId: string) => {
    setFormData({
      ...formData,
      projectId,
      phaseId: '' // Reset phase when project changes
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const assignedTeam = allTeams.find(t => t.id === formData.assignedToTeamId);
    const selectedPhase = availablePhases.find(p => p.id === formData.phaseId);
    
    // حساب الهدف الافتراضي للمهمة بناءً على هدف المرحلة
    const phaseTarget = selectedPhase?.totalTarget || 100;
    const defaultTaskTarget = Math.ceil(phaseTarget / 5); // افتراض 5 مهام لكل مرحلة
    
    const newTask = {
      title: formData.title,
      description: formData.description,
      status: 'todo' as const,
      priority: formData.priority as 'low' | 'medium' | 'high',
      assignedToTeamId: formData.assignedToTeamId || null,
      assignedToTeamName: assignedTeam?.name,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      progress: 0,
      phaseId: formData.phaseId,
      projectId: formData.projectId,
      totalTarget: defaultTaskTarget,
      dailyAchievements: [],
      riskLevel: 'low' as const,
      completionRate: 0,
      timeSpent: 0,
      isOverdue: false,
      lastActivity: new Date()
    };

    addTask(newTask);
    setFormData({
      title: '',
      description: '',
      phaseId: '',
      projectId: '',
      assignedToTeamId: '',
      priority: 'medium',
      startDate: new Date().toISOString().split('T')[0],
      endDate: addDays(new Date(), 7).toISOString().split('T')[0],
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">New Task</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              عنوان المهمة
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الوصف
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              المشروع
            </label>
            <select
              value={formData.projectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">اختر مشروع</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              مرحلة المشروع
            </label>
            <select
              value={formData.phaseId}
              onChange={(e) => setFormData({ ...formData, phaseId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={!formData.projectId}
            >
              <option value="">اختر مرحلة المشروع</option>
              {availablePhases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              تعيين إلى فريق
            </label>
            <select
              value={formData.assignedToTeamId}
              onChange={(e) => setFormData({ ...formData, assignedToTeamId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">غير مُكلف لفريق</option>
              {allTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name} ({team.memberCount} أعضاء)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الأولوية
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="low">منخفضة</option>
              <option value="medium">متوسطة</option>
              <option value="high">عالية</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ البداية
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ النهاية
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              إنشاء المهمة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};