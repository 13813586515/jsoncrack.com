import { en } from "./translations/en";
import { zh } from "./translations/zh";
import { ja } from "./translations/ja";
import { ko } from "./translations/ko";

export type Language = "en" | "zh" | "ja" | "ko";

export const translations: Record<Language, typeof en> = {
  en,
  zh,
  ja,
  ko,
};

export type Translations = typeof en;

export const languageNames: Record<Language, keyof Translations> = {
  en: "english",
  zh: "chinese",
  ja: "japanese",
  ko: "korean",
};
