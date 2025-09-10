import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeamModal: React.FC<TeamModalProps> = ({ isOpen, onClose }) => {
  const { addTeam } = useData();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // إنشاء الفريق
    const newTeam = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      members: [],
      createdAt: new Date(),
    };

    try {
      const teamData = await addTeam(newTeam);
      if (teamData && teamData.id) {
        // إعادة تعيين النموذج وإغلاقه
        setFormData({
          name: '',
          description: '',
        });
        onClose();
      } else {
        console.error('Failed to create team');
      }
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">فريق جديد</h2>
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
              اسم الفريق
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              إنشاء الفريق
            </button>
          </div>
        </form>
      </div>
      </div>

    </>
  );
};