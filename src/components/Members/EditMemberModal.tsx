import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { supabase, handleSupabaseError } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: any;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({ isOpen, onClose, member }) => {
  const { teams, updateTeam } = useData();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    jobTitle: '',
    role: 'member' as 'manager' | 'member',
    salary: '',
    idPhotoUrl: '',
    pdfFileUrl: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  // تحديث البيانات عند تغيير العضو
  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || '',
        email: member.email || '',
        department: member.department || '',
        jobTitle: member.jobTitle || '',
        role: member.role === 'lead' ? 'manager' : 'member',
        salary: member.salary ? member.salary.toString() : '',
        idPhotoUrl: member.idPhotoUrl || '',
        pdfFileUrl: member.pdfFileUrl || '',
      });
    }
  }, [member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!member) return;

    setIsLoading(true);

    try {
      // تحديث بيانات العضو في قاعدة البيانات
      const { error } = await supabase
        .from('simple_team_members')
        .update({
          name: formData.name,
          email: formData.email || null,
          role: formData.role,
          department: formData.department || null,
          job_title: formData.jobTitle || null,
          salary: formData.salary ? parseFloat(formData.salary) : null,
          id_photo_url: formData.idPhotoUrl || null,
          pdf_file_url: formData.pdfFileUrl || null,
        })
        .eq('id', member.id);

      if (error) {
        toast.error(handleSupabaseError(error));
        return;
      }

      // تحديث الحالة المحلية
      const updatedMember = {
        ...member,
        name: formData.name,
        email: formData.email || undefined,
        role: (formData.role === 'manager' ? 'lead' : formData.role) as 'lead' | 'member',
        department: formData.department || undefined,
        jobTitle: formData.jobTitle || undefined,
        salary: formData.salary ? parseFloat(formData.salary) : undefined,
        idPhotoUrl: formData.idPhotoUrl || undefined,
        pdfFileUrl: formData.pdfFileUrl || undefined,
      };

      // تحديث الفريق المحلي
      const team = teams.find(t => t.id === member.teamId);
      if (team) {
        const updatedMembers = team.members.map(m =>
          m.id === member.id ? updatedMember : m
        );
        const updatedTeam = { ...team, members: updatedMembers };
        updateTeam(team.id, updatedTeam);
      }

      toast.success('تم تحديث بيانات العضو بنجاح');
      onClose();
    } catch (error) {
      console.error('Error updating member:', error);
      toast.error('حدث خطأ أثناء تحديث بيانات العضو');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            تعديل بيانات العضو
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
              الاسم الكامل
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="أدخل الاسم الكامل للعضو"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="أدخل البريد الإلكتروني للعضو"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              القسم
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="أدخل القسم الذي ينتمي إليه العضو"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              المسمى الوظيفي
            </label>
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="أدخل المسمى الوظيفي للعضو"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الدور
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'manager' | 'member' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="member">عضو</option>
              <option value="manager">قائد الفريق</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الراتب
            </label>
            <input
              type="number"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="أدخل الراتب الشهري"
              step="0.01"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              رابط صورة الهوية
            </label>
            <input
              type="url"
              value={formData.idPhotoUrl}
              onChange={(e) => setFormData({ ...formData, idPhotoUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="أدخل رابط صورة الهوية"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              رابط ملف PDF
            </label>
            <input
              type="url"
              value={formData.pdfFileUrl}
              onChange={(e) => setFormData({ ...formData, pdfFileUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="أدخل رابط ملف PDF"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>الفريق:</strong> {member.teamName}
            </p>
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
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'جاري التحديث...' : 'تحديث البيانات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};