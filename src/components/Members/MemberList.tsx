import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Plus, Mail, Calendar, Users, Crown, User, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { AddMemberModal } from './AddMemberModal';
import { EditMemberModal } from './EditMemberModal';

export const MemberList: React.FC = () => {
   const { teams } = useData();
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedTeamId, setSelectedTeamId] = useState<string>('');
   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
   const [selectedMember, setSelectedMember] = useState<any>(null);

  // Get all members from all teams
   const allMembers = teams.flatMap(team =>
     team.members.map(member => ({
       ...member,
       teamName: team.name,
       teamId: team.id,
       department: (member as any).department,
       jobTitle: (member as any).jobTitle,
       salary: (member as any).salary,
       idPhotoUrl: (member as any).idPhotoUrl,
       pdfFileUrl: (member as any).pdfFileUrl,
     }))
   );

  const getRoleIcon = (role: string) => {
    return role === 'lead' ? Crown : User;
  };

  const getRoleColor = (role: string) => {
    return role === 'lead' 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-blue-100 text-blue-800';
  };

  const handleAddMember = (teamId: string) => {
    setSelectedTeamId(teamId);
    setIsModalOpen(true);
  };

  const handleEditMember = (member: any) => {
    setSelectedMember(member);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">الأعضاء</h2>
          <p className="text-gray-600">عرض وإدارة جميع أعضاء الفرق عبر المشاريع</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">اختر فريق لإضافة عضو</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => selectedTeamId && handleAddMember(selectedTeamId)}
            disabled={!selectedTeamId}
            className="btn-primary px-4 py-2 flex items-center space-x-2 space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-5 w-5" />
            <span>إضافة عضو</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">إجمالي الأعضاء</p>
              <p className="text-3xl font-bold text-gray-900">{allMembers.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">قادة الفرق</p>
              <p className="text-3xl font-bold text-gray-900">
                {allMembers.filter(m => m.role === 'lead').length}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Crown className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">الفرق النشطة</p>
              <p className="text-3xl font-bold text-gray-900">{teams.length}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allMembers.map((member) => {
          const RoleIcon = getRoleIcon(member.role);
          return (
            <div
              key={`${member.teamId}-${member.id}`}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(member.role)}`}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {member.role === 'lead' ? 'قائد الفريق' : 'عضو'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {member.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="truncate">{member.email}</span>
                  </div>
                )}

                {member.department && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>القسم: {member.department}</span>
                  </div>
                )}

                {member.jobTitle && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>المسمى الوظيفي: {member.jobTitle}</span>
                  </div>
                )}

                {member.salary && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>الراتب: {member.salary.toLocaleString()} ريال</span>
                  </div>
                )}

                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{member.teamName}</span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>انضم {format(member.joinedAt, 'dd MMM yyyy')}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex space-x-2 space-x-reverse">
                  <button
                    onClick={() => handleEditMember(member)}
                    className="btn-primary flex-1 py-2 px-4 text-sm font-medium flex items-center justify-center space-x-2 space-x-reverse"
                  >
                    <Edit className="h-4 w-4" />
                    <span>تعديل</span>
                  </button>
                  <button className="btn-secondary flex-1 py-2 px-4 text-sm font-medium">
                    عرض الملف الشخصي
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {allMembers.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">لا يوجد أعضاء</h3>
          <p className="mt-1 text-sm text-gray-500">
            ابدأ بإضافة أعضاء إلى فرقك.
          </p>
        </div>
      )}

      <AddMemberModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTeamId('');
        }}
        teamId={selectedTeamId}
      />

      <EditMemberModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedMember(null);
        }}
        member={selectedMember}
      />
    </div>
  );
};