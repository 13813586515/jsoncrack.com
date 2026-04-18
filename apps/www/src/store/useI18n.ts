import React from "react";
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

function useIsMounted() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}

export const useTranslation = () => {
  const storeLanguage = useI18n(state => state.language);
  const setLanguage = useI18n(state => state.setLanguage);
  const mounted = useIsMounted();

  const language = React.useMemo(() => {
    return mounted ? storeLanguage : "en";
  }, [mounted, storeLanguage]);

  const t = React.useCallback(
    (key: keyof Translations) => {
      return translations[language][key] || translations.en[key] || key;
    },
    [language]
  );

  return {
    language,
    t,
    setLanguage,
    languages: ["en", "zh", "ja", "ko"] as Language[],
    languageNames,
    translations,
    isMounted: mounted,
  };
};

export default useI18n;
