import React, { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { Upload, Save, Image, Building2, Palette } from 'lucide-react';
import toast from 'react-hot-toast';

export const CompanySettings: React.FC = () => {
  const { settings, updateSettings, uploadLogo } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: settings.name,
    primaryColor: settings.primaryColor,
    secondaryColor: settings.secondaryColor,
  });

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة صالح');
      return;
    }

    // التحقق من حجم الملف (أقل من 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('حجم الملف يجب أن يكون أقل من 2 ميجابايت');
      return;
    }

    setIsLoading(true);
    try {
      const logoDataUrl = await uploadLogo(file);
      updateSettings({ logo: logoDataUrl });
      toast.success('تم رفع اللوجو بنجاح');
    } catch (error) {
      toast.error('فشل في رفع اللوجو');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = () => {
    updateSettings(formData);
    toast.success('تم حفظ الإعدادات بنجاح');
  };

  const handleRemoveLogo = () => {
    updateSettings({ logo: null });
    toast.success('تم حذف اللوجو');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold gradient-text">إعدادات الشركة</h2>
        <p className="text-accent-dark/80">إدارة معلومات الشركة واللوجو</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* إعدادات اللوجو */}
        <div className="card-professional p-6">
          <div className="flex items-center space-x-3 space-x-reverse mb-4">
            <Image className="h-6 w-6 text-accent-dark" />
            <h3 className="text-lg font-semibold text-accent-dark">لوجو الشركة</h3>
          </div>

          <div className="space-y-4">
            {/* عرض اللوجو الحالي */}
            {settings.logo ? (
              <div className="text-center">
                <div className="inline-block p-4 bg-accent-light/20 rounded-lg border-2 border-dashed border-accent-light">
                  <img 
                    src={settings.logo} 
                    alt="لوجو الشركة" 
                    className="max-w-32 max-h-32 object-contain mx-auto"
                  />
                </div>
                <button
                  onClick={handleRemoveLogo}
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                  حذف اللوجو
                </button>
              </div>
            ) : (
              <div className="text-center p-8 border-2 border-dashed border-accent-light rounded-lg bg-accent-light/10">
                <Image className="h-12 w-12 text-accent-dark/50 mx-auto mb-2" />
                <p className="text-accent-dark/70">لا يوجد لوجو</p>
              </div>
            )}

            {/* رفع لوجو جديد */}
            <div>
              <label className="block text-sm font-medium text-accent-dark mb-2">
                رفع لوجو جديد
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                  disabled={isLoading}
                />
                <label
                  htmlFor="logo-upload"
                  className={`btn-secondary w-full flex items-center justify-center space-x-2 space-x-reverse cursor-pointer ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Upload className="h-5 w-5" />
                  <span>{isLoading ? 'جاري الرفع...' : 'اختيار ملف'}</span>
                </label>
              </div>
              <p className="text-xs text-accent-dark/60 mt-1">
                PNG, JPG, GIF حتى 2MB
              </p>
            </div>
          </div>
        </div>

        {/* إعدادات الشركة */}
        <div className="card-professional p-6">
          <div className="flex items-center space-x-3 space-x-reverse mb-4">
            <Building2 className="h-6 w-6 text-accent-dark" />
            <h3 className="text-lg font-semibold text-accent-dark">معلومات الشركة</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-accent-dark mb-2">
                اسم الشركة
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-professional"
                placeholder="أدخل اسم الشركة"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-accent-dark mb-2">
                اللون الأساسي
              </label>
              <div className="flex items-center space-x-3 space-x-reverse">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-12 h-10 rounded border border-accent-light"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="input-professional flex-1"
                  placeholder="#5f979d"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-accent-dark mb-2">
                اللون الثانوي
              </label>
              <div className="flex items-center space-x-3 space-x-reverse">
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="w-12 h-10 rounded border border-accent-light"
                />
                <input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="input-professional flex-1"
                  placeholder="#b4e1e6"
                />
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              className="btn-primary w-full flex items-center justify-center space-x-2 space-x-reverse"
            >
              <Save className="h-5 w-5" />
              <span>حفظ الإعدادات</span>
            </button>
          </div>
        </div>
      </div>

      {/* معاينة */}
      <div className="card-professional p-6">
        <h3 className="text-lg font-semibold text-accent-dark mb-4">معاينة</h3>
        <div className="flex items-center space-x-4 space-x-reverse p-4 bg-accent-light/20 rounded-lg">
          {settings.logo && (
            <img 
              src={settings.logo} 
              alt="لوجو الشركة" 
              className="w-12 h-12 object-contain"
            />
          )}
          <div>
            <h4 className="text-xl font-bold gradient-text">{formData.name}</h4>
            <p className="text-accent-dark/80">نظام إدارة المشاريع</p>
          </div>
        </div>
      </div>
    </div>
  );
};