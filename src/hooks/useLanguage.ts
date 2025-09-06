"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language, TranslationKey, getTranslation } from '@/src/lib/i18n';

interface LanguageState {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
}

export const useLanguage = create<LanguageState>()(
  persist(
    (set, get) => ({
      currentLanguage: 'en',
      
      setLanguage: (language: Language) => {
        set({ currentLanguage: language });
      },
      
      t: (key: TranslationKey) => {
        const state = get();
        return getTranslation(key, state.currentLanguage);
      },
    }),
    {
      name: 'huntaze-language',
    }
  )
);
