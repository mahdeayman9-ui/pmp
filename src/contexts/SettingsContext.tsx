import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, handleSupabaseError } from '../lib/supabase';
import toast from 'react-hot-toast';

interface CompanySettings {
  name: string;
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
}

interface SettingsContextType {
  settings: CompanySettings;
  updateSettings: (newSettings: Partial<CompanySettings>) => Promise<void>;
  uploadLogo: (file: File) => Promise<string>;
  isLoading: boolean;
}

const defaultSettings: CompanySettings = {
  name: 'إدارة المشاريع',
  logo: null,
  primaryColor: '#5f979d',
  secondaryColor: '#b4e1e6'
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);

  // تحميل إعدادات الشركة من قاعدة البيانات
  useEffect(() => {
    loadCompanySettings();
  }, []);

  const loadCompanySettings = async () => {
    try {
      const { data: companies, error } = await supabase
        .from('companies')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading company settings:', error);
        return;
      }

      if (companies) {
        setSettings({
          name: companies.name,
          logo: companies.logo_url,
          primaryColor: companies.primary_color,
          secondaryColor: companies.secondary_color,
        });
      } else {
        // إنشاء إعدادات افتراضية إذا لم توجد
        await createDefaultSettings();
      }
    } catch (error) {
      console.error('Error loading company settings:', error);
    }
  };

  const createDefaultSettings = async () => {
    try {
      const { error } = await supabase
        .from('companies')
        .insert({
          name: defaultSettings.name,
          logo_url: defaultSettings.logo,
          primary_color: defaultSettings.primaryColor,
          secondary_color: defaultSettings.secondaryColor,
        });

      if (error) {
        console.error('Error creating default settings:', error);
      }
    } catch (error) {
      console.error('Error creating default settings:', error);
    }
  };

  // تحديث الإعدادات
  const updateSettings = async (newSettings: Partial<CompanySettings>) => {
    setIsLoading(true);
    try {
      const updatedSettings = { ...settings, ...newSettings };

      // تحديث في قاعدة البيانات
      const { error } = await supabase
        .from('companies')
        .upsert({
          name: updatedSettings.name,
          logo_url: updatedSettings.logo,
          primary_color: updatedSettings.primaryColor,
          secondary_color: updatedSettings.secondaryColor,
        });

      if (error) {
        toast.error(handleSupabaseError(error));
        return;
      }

      // تحديث الحالة المحلية
      setSettings(updatedSettings);
      
      // حفظ في localStorage كنسخة احتياطية
      localStorage.setItem('companySettings', JSON.stringify(updatedSettings));
      
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setIsLoading(false);
    }
  };

  // رفع اللوجو
  const uploadLogo = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result);
      };
      reader.onerror = () => reject(new Error('فشل في قراءة الملف'));
      reader.readAsDataURL(file);
    });
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSettings,
      uploadLogo,
      isLoading
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};