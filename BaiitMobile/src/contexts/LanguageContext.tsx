import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { supportedLanguages } from '../i18n';

const LANGUAGE_STORAGE_KEY = '@baiit_language';

export type LanguageCode = 'zh-CN' | 'en-US' | 'ja-JP';

interface LanguageContextValue {
  currentLanguage: LanguageCode;
  setLanguage: (code: LanguageCode) => Promise<void>;
  languages: typeof supportedLanguages;
  t: (key: string, options?: Record<string, unknown>) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('zh-CN');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage && supportedLanguages.find(l => l.code === savedLanguage)) {
        await i18n.changeLanguage(savedLanguage);
        setCurrentLanguage(savedLanguage as LanguageCode);
      }
    } catch (error) {
      console.error('Failed to load language:', error);
    }
  };

  const setLanguage = async (code: LanguageCode) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
      await i18n.changeLanguage(code);
      setCurrentLanguage(code);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, languages: supportedLanguages, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
