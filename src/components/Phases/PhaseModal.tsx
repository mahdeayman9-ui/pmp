import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { addDays } from 'date-fns';

interface PhaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  phase?: any;
}

export const PhaseModal: React.FC<PhaseModalProps> = ({ isOpen, onClose, projectId, phase }) => {
  const { projects, addPhase, updatePhase } = useData();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    totalTarget: 100,
    startDate: new Date().toISOString().split('T')[0],
    endDate: addDays(new Date(), 14).toISOString().split('T')[0],
    status: 'not-started' as 'not-started' | 'in-progress' | 'completed',
  });

  const project = projects.find(p => p.id === projectId);
  const isEditing = !!phase;

  useEffect(() => {
    if (phase) {
      setFormData({
        name: phase.name,
        description: phase.description,
        totalTarget: phase.totalTarget || 100,
        startDate: new Date(phase.startDate).toISOString().split('T')[0],
        endDate: new Date(phase.endDate).toISOString().split('T')[0],
        status: phase.status,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        totalTarget: 100,
        startDate: new Date().toISOString().split('T')[0],
        endDate: addDays(new Date(), 14).toISOString().split('T')[0],
        status: 'not-started',
      });
    }
  }, [phase]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectId) {
      alert('يرجى اختيار مشروع أولاً');
      return;
    }

    const phaseData = {
      name: formData.name,
      description: formData.description,
      totalTarget: Number(formData.totalTarget),
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      status: formData.status,
      progress: formData.status === 'completed' ? 100 : 
                formData.status === 'in-progress' ? 50 : 0,
      projectId: projectId,
    };

    if (isEditing) {
      updatePhase(phase.id, phaseData);
    } else {
      addPhase(phaseData);
    }

    setFormData({
      name: '',
      description: '',
      totalTarget: 100,
      startDate: new Date().toISOString().split('T')[0],
      endDate: addDays(new Date(), 14).toISOString().split('T')[0],
      status: 'not-started',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'تعديل المرحلة' : 'مرحلة جديدة'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {project && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>المشروع:</strong> {project.name}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              {project.description}
            </p>
            <p className="text-xs text-blue-600 mt-2 font-medium">
              💡 سيتم إنشاء مهمة تلقائية لهذه المرحلة في قائمة المهام ومتتبع المهام
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              اسم المرحلة
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="مثال: مرحلة التصميم"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              وصف المرحلة
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="وصف تفصيلي للمرحلة وأهدافها"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الهدف الإجمالي للمرحلة
            </label>
            <input
              type="number"
              value={formData.totalTarget}
              onChange={(e) => setFormData({ ...formData, totalTarget: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="100"
              min="1"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              سيتم توزيع هذا الهدف على المهام المرتبطة بهذه المرحلة
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              حالة المرحلة
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="not-started">لم تبدأ</option>
              <option value="in-progress">قيد التنفيذ</option>
              <option value="completed">مكتملة</option>
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

          <div className="flex justify-end space-x-3 space-x-reverse pt-4">
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
              {isEditing ? 'تحديث المرحلة' : 'إنشاء المرحلة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};