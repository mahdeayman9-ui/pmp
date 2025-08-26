import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CompanySettings {
  name: string;
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
}

interface SettingsContextType {
  settings: CompanySettings;
  updateSettings: (newSettings: Partial<CompanySettings>) => void;
  uploadLogo: (file: File) => Promise<string>;
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

  // تحميل الإعدادات من localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('companySettings');
    if (savedSettings) {
      setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
    }
  }, []);

  // حفظ الإعدادات في localStorage
  const updateSettings = (newSettings: Partial<CompanySettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('companySettings', JSON.stringify(updatedSettings));
  };

  // رفع اللوجو وتحويله إلى base64
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
      uploadLogo
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