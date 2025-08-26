import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Plus, Users, UserPlus, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { TeamModal } from './TeamModal';
import { AddMemberModal } from '../Members/AddMemberModal';

export const TeamList: React.FC = () => {
  const { teams } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  const handleAddMember = (teamId: string) => {
    setSelectedTeamId(teamId);
    setIsAddMemberModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">الفرق</h2>
          <p className="text-gray-600">إدارة فرقك وأعضاء الفريق</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 space-x-reverse"
        >
          <Plus className="h-5 w-5" />
          <span>فريق جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div
            key={team.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                <p className="text-gray-600 text-sm mt-1">{team.description}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">الأعضاء</span>
                  <span className="text-sm text-gray-500">{team.members.length} عضو</span>
                </div>
                <div className="space-y-2">
                  {team.members.slice(0, 3).map((member) => (
                    <div key={member.id} className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-700">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500">
                          {member.role === 'lead' ? 'قائد الفريق' : 'عضو'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {team.members.length > 3 && (
                    <p className="text-xs text-gray-500">
                      +{team.members.length - 3} أعضاء آخرين
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">تاريخ الإنشاء</span>
                  <span className="text-gray-900">{format(team.createdAt, 'dd MMM yyyy', { locale: ar })}</span>
                </div>
              </div>

              <button 
                onClick={() => handleAddMember(team.id)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 space-x-reverse"
              >
                <UserPlus className="h-4 w-4" />
                <span>إضافة عضو</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <TeamModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <AddMemberModal 
        isOpen={isAddMemberModalOpen}
        onClose={() => {
          setIsAddMemberModalOpen(false);
          setSelectedTeamId('');
        }}
        teamId={selectedTeamId}
      />
    </div>
  );
};