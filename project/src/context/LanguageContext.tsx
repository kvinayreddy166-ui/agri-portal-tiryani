import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { repairTeluguText } from '../utils/textRepair';

function hasValidTelugu(text?: string | null): boolean {
  if (!text?.trim()) return false;
  return /[\u0C00-\u0C7F]/.test(text);
}

type Language = 'en' | 'te';

interface LanguageContextType {
  language: Language;
  isTelugu: boolean;
  toggleLanguage: () => void;
  t: (english: string, telugu: string) => string;
}

type LanguageProviderProps = {
  children: ReactNode;
  sectionKey?: string;
  userKey?: string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const LANGUAGE_KEY = 'tiryani-language';
const SCOPED_LANGUAGE_KEY_PREFIX = 'tiryani-language:v2';

function normalizeLanguageKeyPart(value?: string) {
  return String(value || 'public')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'public';
}

function scopedLanguageKey(userKey?: string, sectionKey?: string) {
  return [
    SCOPED_LANGUAGE_KEY_PREFIX,
    normalizeLanguageKeyPart(userKey),
    normalizeLanguageKeyPart(sectionKey || 'default'),
  ].join(':');
}

function readStoredLanguage(storageKey: string): Language {
  const scoped = window.localStorage.getItem(storageKey);
  if (scoped === 'te' || scoped === 'en') return scoped;

  const legacy = window.localStorage.getItem(LANGUAGE_KEY);
  return legacy === 'te' ? 'te' : 'en';
}

export function LanguageProvider({ children, sectionKey = 'default', userKey = 'public' }: LanguageProviderProps) {
  const storageKey = useMemo(() => scopedLanguageKey(userKey, sectionKey), [sectionKey, userKey]);
  const [language, setLanguage] = useState<Language>(() => readStoredLanguage(storageKey));

  useEffect(() => {
    setLanguage(readStoredLanguage(storageKey));
  }, [storageKey]);

  const value = useMemo(
    () => ({
      language,
      isTelugu: language === 'te',
      toggleLanguage: () =>
        setLanguage((current) => {
          const next = current === 'en' ? 'te' : 'en';
          window.localStorage.setItem(storageKey, next);
          return next;
        }),
      t: (english: string, telugu: string) => {
        if (language !== 'te') return english;
        const repairedTelugu = repairTeluguText(telugu);
        return hasValidTelugu(repairedTelugu) ? repairedTelugu : english;
      },
    }),
    [language, storageKey]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// Context modules intentionally export both the provider and hook.
// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
