import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Language, Translations } from "../lib/i18n";
import { translations, languageNames } from "../lib/i18n";

interface I18nActions {
  setLanguage: (language: Language) => void;
  t: (key: keyof Translations) => string;
}

const initialStates = {
  language: "en" as Language,
};

const useI18n = create(
  persist<typeof initialStates & I18nActions>(
    (set, get) => ({
      ...initialStates,
      setLanguage: language => set({ language }),
      t: key => {
        const lang = get().language;
        return translations[lang][key] || translations.en[key] || key;
      },
    }),
    {
      name: "i18n",
    }
  )
);

export const useTranslation = () => {
  const language = useI18n(state => state.language);
  const t = useI18n(state => state.t);
  const setLanguage = useI18n(state => state.setLanguage);

  return {
    language,
    t,
    setLanguage,
    languages: ["en", "zh", "ja", "ko"] as Language[],
    languageNames,
    translations,
  };
};

export default useI18n;
