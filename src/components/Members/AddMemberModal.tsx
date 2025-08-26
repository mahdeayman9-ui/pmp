import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, teamId }) => {
  const { teams, updateTeam } = useData();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'member' as 'lead' | 'member',
  });

  const team = teams.find(t => t.id === teamId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!team) return;

    const newMember = {
      id: Date.now().toString(),
      userId: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      role: formData.role,
      joinedAt: new Date(),
    };

    const updatedTeam = {
      ...team,
      members: [...team.members, newMember],
    };

    updateTeam(teamId, updatedTeam);
    
    setFormData({
      name: '',
      email: '',
      role: 'member',
    });
    onClose();
  };

  if (!isOpen || !team) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Add Member to {team.name}
          </h2>
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
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter member's full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter member's email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'lead' | 'member' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="member">Member</option>
              <option value="lead">Team Lead</option>
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Team:</strong> {team.name}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              {team.description}
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};