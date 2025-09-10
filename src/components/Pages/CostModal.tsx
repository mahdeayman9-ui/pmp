import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

interface CostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingCost?: {
    id: string;
    item: string;
    planned_cost: number;
    actual_cost: number;
    planned_date: string | null;
    actual_date: string | null;
  } | null;
}

const CostModal: React.FC<CostModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCost
}) => {
  const { user } = useAuth();
  const { projects } = useData();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    item: '',
    planned_cost: 0,
    actual_cost: 0,
    planned_date: '',
    actual_date: '',
    project_id: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingCost) {
      setFormData({
        item: editingCost.item,
        planned_cost: editingCost.planned_cost,
        actual_cost: editingCost.actual_cost,
        planned_date: editingCost.planned_date || '',
        actual_date: editingCost.actual_date || '',
        project_id: (editingCost as any).project_id || ''
      });
    } else {
      setFormData({
        item: '',
        planned_cost: 0,
        actual_cost: 0,
        planned_date: '',
        actual_date: '',
        project_id: ''
      });
    }
    setErrors({});
  }, [editingCost, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.item.trim()) {
      newErrors.item = 'اسم البند مطلوب';
    }

    if (formData.planned_cost < 0) {
      newErrors.planned_cost = 'القيمة يجب أن تكون موجبة';
    }

    if (formData.actual_cost < 0) {
      newErrors.actual_cost = 'القيمة يجب أن تكون موجبة';
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
    const amountVariance = formData.actual_cost - formData.planned_cost;

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

      const costData = {
        item: formData.item,
        planned_cost: formData.planned_cost,
        actual_cost: formData.actual_cost,
        planned_date: formData.planned_date || null,
        actual_date: formData.actual_date || null,
        amount_variance: amountVariance,
        days_variance: daysVariance,
        company_id: profile.company_id,
        project_id: formData.project_id || null,
        created_by: user?.id
      };

      if (editingCost) {
        // Update existing cost
        const { error } = await supabase
          .from('costs')
          .update(costData)
          .eq('id', editingCost.id);

        if (error) throw error;
      } else {
        // Create new cost
        const { error } = await supabase
          .from('costs')
          .insert([costData]);

        if (error) throw error;
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving cost:', error);
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
              {editingCost ? 'تعديل المصروف' : 'إضافة مصروف جديد'}
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

            {/* Planned Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                التكاليف المخططة
              </label>
              <input
                type="number"
                value={formData.planned_cost}
                onChange={(e) => setFormData({ ...formData, planned_cost: Number(e.target.value) })}
                className={`input-professional ${errors.planned_cost ? 'border-red-500' : ''}`}
                placeholder="0"
                min="0"
                step="0.01"
              />
              {errors.planned_cost && (
                <p className="text-red-500 text-sm mt-1">{errors.planned_cost}</p>
              )}
            </div>

            {/* Actual Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                التكاليف الفعلية
              </label>
              <input
                type="number"
                value={formData.actual_cost}
                onChange={(e) => setFormData({ ...formData, actual_cost: Number(e.target.value) })}
                className={`input-professional ${errors.actual_cost ? 'border-red-500' : ''}`}
                placeholder="0"
                min="0"
                step="0.01"
              />
              {errors.actual_cost && (
                <p className="text-red-500 text-sm mt-1">{errors.actual_cost}</p>
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

            {/* Variance Preview */}
            {(formData.planned_cost > 0 || formData.actual_cost > 0) && (
              <div className="bg-primary-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-primary-800 mb-2">معاينة الانحرافات:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">الانحراف المالي:</span>
                    <span className={`font-medium ml-2 ${
                      calculateVariance().amountVariance <= 0 ? 'text-green-600' : 'text-red-600'
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
                  editingCost ? 'تحديث' : 'إضافة'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CostModal;