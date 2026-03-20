import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';

export const resources = {
  'zh-CN': { translation: zhCN },
  'en-US': { translation: enUS },
};

export const supportedLanguages = [
  { code: 'zh-CN', name: '中文', nativeName: '中文' },
  { code: 'en-US', name: 'English', nativeName: 'English' },
];

const getDeviceLanguage = (): string => {
  const locales = getLocales();
  const deviceLocale = locales[0]?.languageCode || 'zh';
  
  if (deviceLocale === 'zh') return 'zh-CN';
  if (deviceLocale === 'ja') return 'ja-JP';
  return 'en-US';
};

i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: 'zh-CN',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
