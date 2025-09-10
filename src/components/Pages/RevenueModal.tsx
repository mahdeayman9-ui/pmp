import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

interface RevenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingRevenue?: {
    id: string;
    item: string;
    planned_revenue: number;
    actual_revenue: number;
    planned_date: string | null;
    actual_date: string | null;
    collection_status: boolean;
  } | null;
}

const RevenueModal: React.FC<RevenueModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingRevenue
}) => {
  const { user } = useAuth();
  const { projects } = useData();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    item: '',
    planned_revenue: 0,
    actual_revenue: 0,
    planned_date: '',
    actual_date: '',
    collection_status: false,
    project_id: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingRevenue) {
      setFormData({
        item: editingRevenue.item,
        planned_revenue: editingRevenue.planned_revenue,
        actual_revenue: editingRevenue.actual_revenue,
        planned_date: editingRevenue.planned_date || '',
        actual_date: editingRevenue.actual_date || '',
        collection_status: editingRevenue.collection_status,
        project_id: (editingRevenue as any).project_id || ''
      });
    } else {
      setFormData({
        item: '',
        planned_revenue: 0,
        actual_revenue: 0,
        planned_date: '',
        actual_date: '',
        collection_status: false,
        project_id: ''
      });
    }
    setErrors({});
  }, [editingRevenue, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.item.trim()) {
      newErrors.item = 'اسم البند مطلوب';
    }

    if (formData.planned_revenue < 0) {
      newErrors.planned_revenue = 'القيمة يجب أن تكون موجبة';
    }

    if (formData.actual_revenue < 0) {
      newErrors.actual_revenue = 'القيمة يجب أن تكون موجبة';
    }

    if (formData.planned_date && formData.actual_date) {
      const plannedDate = new Date(formData.planned_date);
      const actualDate = new Date(formData.actual_date);

      if (actualDate < plannedDate) {
        newErrors.actual_date = 'تاريخ التنفيذ يجب أن يكون بعد تاريخ التخطيط';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateVariance = () => {
    const amountVariance = formData.actual_revenue - formData.planned_revenue;

    let daysVariance = 0;
    if (formData.planned_date && formData.actual_date) {
      const plannedDate = new Date(formData.planned_date);
      const actualDate = new Date(formData.actual_date);
      const diffTime = actualDate.getTime() - plannedDate.getTime();
      daysVariance = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return { amountVariance, daysVariance };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Get user's company ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.company_id) {
        setErrors({ submit: 'لم يتم العثور على شركة مرتبطة بحسابك. يرجى التواصل مع الإدارة.' });
        setLoading(false);
        return;
      }

      const { amountVariance, daysVariance } = calculateVariance();

      const revenueData = {
        item: formData.item,
        planned_revenue: formData.planned_revenue,
        actual_revenue: formData.actual_revenue,
        planned_date: formData.planned_date || null,
        actual_date: formData.actual_date || null,
        amount_variance: amountVariance,
        days_variance: daysVariance,
        collection_status: formData.collection_status,
        company_id: profile.company_id,
        project_id: formData.project_id || null,
        created_by: user?.id
      };

      if (editingRevenue) {
        // Update existing revenue
        const { error } = await supabase
          .from('revenues')
          .update(revenueData)
          .eq('id', editingRevenue.id);

        if (error) throw error;
      } else {
        // Create new revenue
        const { error } = await supabase
          .from('revenues')
          .insert([revenueData]);

        if (error) throw error;
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving revenue:', error);
      setErrors({ submit: 'حدث خطأ أثناء حفظ البيانات' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-primary-800">
              {editingRevenue ? 'تعديل الإيراد' : 'إضافة إيراد جديد'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Item Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم البند *
              </label>
              <input
                type="text"
                value={formData.item}
                onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                className={`input-professional ${errors.item ? 'border-red-500' : ''}`}
                placeholder="أدخل اسم البند"
              />
              {errors.item && (
                <p className="text-red-500 text-sm mt-1">{errors.item}</p>
              )}
            </div>

            {/* Project Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المشروع
              </label>
              <select
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                className="input-professional"
              >
                <option value="">اختر مشروع (اختياري)</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">يمكنك ترك هذا الحقل فارغاً للبيانات العامة</p>
            </div>

            {/* Planned Revenue */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الإيرادات المخططة
              </label>
              <input
                type="number"
                value={formData.planned_revenue}
                onChange={(e) => setFormData({ ...formData, planned_revenue: Number(e.target.value) })}
                className={`input-professional ${errors.planned_revenue ? 'border-red-500' : ''}`}
                placeholder="0"
                min="0"
                step="0.01"
              />
              {errors.planned_revenue && (
                <p className="text-red-500 text-sm mt-1">{errors.planned_revenue}</p>
              )}
            </div>

            {/* Actual Revenue */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الإيرادات الفعلية
              </label>
              <input
                type="number"
                value={formData.actual_revenue}
                onChange={(e) => setFormData({ ...formData, actual_revenue: Number(e.target.value) })}
                className={`input-professional ${errors.actual_revenue ? 'border-red-500' : ''}`}
                placeholder="0"
                min="0"
                step="0.01"
              />
              {errors.actual_revenue && (
                <p className="text-red-500 text-sm mt-1">{errors.actual_revenue}</p>
              )}
            </div>

            {/* Planned Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                التاريخ المخطط
              </label>
              <input
                type="date"
                value={formData.planned_date}
                onChange={(e) => setFormData({ ...formData, planned_date: e.target.value })}
                className="input-professional"
              />
            </div>

            {/* Actual Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                التاريخ الفعلي
              </label>
              <input
                type="date"
                value={formData.actual_date}
                onChange={(e) => setFormData({ ...formData, actual_date: e.target.value })}
                className={`input-professional ${errors.actual_date ? 'border-red-500' : ''}`}
              />
              {errors.actual_date && (
                <p className="text-red-500 text-sm mt-1">{errors.actual_date}</p>
              )}
            </div>

            {/* Collection Status */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.collection_status}
                  onChange={(e) => setFormData({ ...formData, collection_status: e.target.checked })}
                  className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700">تم التحصيل</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">حدد هذا الخيار إذا تم تحصيل هذا الإيراد</p>
            </div>

            {/* Variance Preview */}
            {(formData.planned_revenue > 0 || formData.actual_revenue > 0) && (
              <div className="bg-primary-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-primary-800 mb-2">معاينة الانحرافات:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">الانحراف المالي:</span>
                    <span className={`font-medium ml-2 ${
                      calculateVariance().amountVariance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {calculateVariance().amountVariance.toLocaleString('ar-EG')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">الانحراف الزمني:</span>
                    <span className={`font-medium ml-2 ${
                      calculateVariance().daysVariance >= 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {calculateVariance().daysVariance} يوم
                    </span>
                  </div>
                </div>
              </div>
            )}

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {errors.submit}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
                disabled={loading}
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    حفظ...
                  </div>
                ) : (
                  editingRevenue ? 'تحديث' : 'إضافة'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RevenueModal;