import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeamModal: React.FC<TeamModalProps> = ({ isOpen, onClose }) => {
  const { addTeam } = useData();
  const { addUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    leaderName: '',
    leaderEmail: '',
  });
  const [generatedCredentials, setGeneratedCredentials] = useState<{username: string, password: string} | null>(null);

  // دالة لتوليد اسم مستخدم وكلمة مرور عشوائية
  const generateCredentials = () => {
    const username = `team_${Math.random().toString(36).substring(2, 8)}`;
    const password = Math.random().toString(36).substring(2, 10);
    return { username, password };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // توليد بيانات الدخول لقائد الفريق
    const credentials = generateCredentials();
    
    // إنشاء الفريق أولاً
    const teamId = Date.now().toString();
    const newTeam = {
      id: teamId,
      name: formData.name,
      description: formData.description,
      members: [
        {
          id: '1',
          userId: Date.now().toString(),
          name: formData.leaderName,
          email: formData.leaderEmail,
          role: 'lead' as const,
          joinedAt: new Date(),
        }
      ],
    };

    addTeam(newTeam);
    
    // إنشاء حساب قائد الفريق
    const teamLeader = {
      id: Date.now().toString(),
      email: formData.leaderEmail,
      name: formData.leaderName,
      role: 'member' as const,
      username: credentials.username,
      generatedPassword: credentials.password,
      teamId: teamId
    };
    
    // إضافة المستخدم الجديد
    if (addUser) {
      addUser(teamLeader);
    }
    
    // عرض بيانات الدخول المولدة
    setGeneratedCredentials(credentials);
    
    // لا نغلق النموذج هنا، سيتم إغلاقه عند إغلاق نافذة البيانات
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

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">بيانات قائد الفريق</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم قائد الفريق
              </label>
              <input
                type="text"
                value={formData.leaderName}
                onChange={(e) => setFormData({ ...formData, leaderName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                البريد الإلكتروني لقائد الفريق
              </label>
              <input
                type="email"
                value={formData.leaderEmail}
                onChange={(e) => setFormData({ ...formData, leaderEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 سيتم إنشاء حساب تلقائي لقائد الفريق مع اسم مستخدم وكلمة مرور مولدة تلقائياً
              </p>
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
              إنشاء الفريق
            </button>
          </div>
        </form>
      </div>
      </div>

      {/* نافذة عرض بيانات الدخول المولدة */}
      {generatedCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="text-center mb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">تم إنشاء الفريق بنجاح!</h2>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-gray-900 mb-3">بيانات دخول قائد الفريق:</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">اسم المستخدم:</span>
                  <span className="font-mono bg-white px-2 py-1 rounded border text-sm">
                    {generatedCredentials.username}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">كلمة المرور:</span>
                  <span className="font-mono bg-white px-2 py-1 rounded border text-sm">
                    {generatedCredentials.password}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                ⚠️ احفظ هذه البيانات في مكان آمن. لن تظهر مرة أخرى!
              </p>
            </div>

            <button
              onClick={() => setGeneratedCredentials(null)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => {
                setGeneratedCredentials(null);
                setFormData({ 
                  name: '', 
                  description: '', 
                  leaderName: '', 
                  leaderEmail: '' 
                });
                onClose();
              }}
            >
              فهمت، أغلق النافذة
            </button>
          </div>
        </div>
      )}
    </>
  );
};