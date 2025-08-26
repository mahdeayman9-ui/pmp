import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Plus, Users, UserPlus, Calendar, Key } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { TeamModal } from './TeamModal';
import { AddMemberModal } from '../Members/AddMemberModal';
import { useAuth } from '../../contexts/AuthContext';

export const TeamList: React.FC = () => {
  const { teams } = useData();
  const { users } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [showCredentials, setShowCredentials] = useState<{teamId: string, credentials: any} | null>(null);

  const handleAddMember = (teamId: string) => {
    setSelectedTeamId(teamId);
    setIsAddMemberModalOpen(true);
  };

  const handleViewCredentials = (teamId: string) => {
    // البحث عن قائد الفريق
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    
    const teamLeader = team.members.find(member => member.role === 'lead');
    if (!teamLeader) return;
    
    // البحث عن بيانات المستخدم
    const user = users?.find(u => u.email === teamLeader.email);
    if (!user || !user.username || !user.generatedPassword) {
      alert('لا توجد بيانات دخول مولدة لهذا الفريق');
      return;
    }
    
    setShowCredentials({
      teamId,
      credentials: {
        username: user.username,
        password: user.generatedPassword,
        teamName: team.name,
        leaderName: teamLeader.name
      }
    });
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
          className="btn-primary px-4 py-2 flex items-center space-x-2 space-x-reverse"
        >
          <Plus className="h-5 w-5" />
          <span>فريق جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div
            key={team.id}
            className="card-professional p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold gradient-text">{team.name}</h3>
                <p className="text-accent-dark/80 text-sm mt-1">{team.description}</p>
              </div>
              <div className="bg-accent-light/30 p-2 rounded-lg">
                <Users className="h-5 w-5 text-accent-dark" />
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
                className="btn-secondary w-full py-2 px-4 flex items-center justify-center space-x-2 space-x-reverse"
              >
                <UserPlus className="h-4 w-4" />
                <span>إضافة عضو</span>
              </button>
              
              <button 
                onClick={() => handleViewCredentials(team.id)}
                className="btn-success w-full py-2 px-4 flex items-center justify-center space-x-2 space-x-reverse mt-2"
              >
                <Key className="h-4 w-4" />
                <span>عرض بيانات الدخول</span>
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

      {/* نافذة عرض بيانات الدخول */}
      {showCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="text-center mb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Key className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">بيانات دخول الفريق</h2>
              <p className="text-gray-600 mt-1">{showCredentials.credentials.teamName}</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-gray-900 mb-3">بيانات دخول قائد الفريق:</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">اسم قائد الفريق:</label>
                  <div className="font-mono bg-white px-3 py-2 rounded border text-sm font-medium">
                    {showCredentials.credentials.leaderName}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">اسم المستخدم:</label>
                  <div className="font-mono bg-white px-3 py-2 rounded border text-sm font-medium">
                    {showCredentials.credentials.username}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">كلمة المرور:</label>
                  <div className="font-mono bg-white px-3 py-2 rounded border text-sm font-medium">
                    {showCredentials.credentials.password}
                  </div>
                </div>
              </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                💡 يمكن لقائد الفريق استخدام هذه البيانات لتسجيل الدخول والوصول لمهام فريقه فقط
              </p>
            </div>
            </div>
            <button
              onClick={() => setShowCredentials(null)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};