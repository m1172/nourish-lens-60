import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ru from './locales/ru.json';
import uzCyrl from './locales/uzCyrl.json';
import uzLatn from './locales/uzLatn.json';

export const LANGUAGE_STORAGE_KEY = 'APP_LANGUAGE';

const resources = {
  'uz-Latn': { translation: uzLatn },
  'uz-Cyrl': { translation: uzCyrl },
  en: { translation: en },
  ru: { translation: ru },
};

const supportedLngs = ['uz-Latn', 'uz-Cyrl', 'en', 'ru'] as const;
type SupportedLanguage = (typeof supportedLngs)[number];

const getDeviceLocale = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getLocales } = require('react-native-localize') as {
      getLocales: () => Array<{ languageCode?: string }>;
    };
    const locales = getLocales?.();
    return locales && locales.length > 0 ? locales[0] : undefined;
  } catch (error) {
    console.warn(
      'react-native-localize not available, defaulting to uz-Latn',
      (error as Error)?.message
    );
    return undefined;
  }
};

const mapDeviceLanguage = (): SupportedLanguage => {
  const deviceLocale = getDeviceLocale();
  const code = deviceLocale?.languageCode?.toLowerCase();

  if (code === 'ru') return 'ru';
  if (code === 'en') return 'en';
  if (code === 'uz') return 'uz-Latn';

  return 'uz-Latn';
};

const init = async () => {
  const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  const savedLanguage = supportedLngs.includes(stored as SupportedLanguage)
    ? (stored as SupportedLanguage)
    : null;

  const initialLanguage = savedLanguage ?? mapDeviceLanguage();

  await i18n.use(initReactI18next).init({
    compatibilityJSON: 'v3',
    resources,
    supportedLngs: [...supportedLngs],
    fallbackLng: 'uz-Latn',
    lng: initialLanguage,
    interpolation: {
      escapeValue: false,
    },
  });
};

void init();

export default i18n;
