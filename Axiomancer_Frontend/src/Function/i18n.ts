// i18n helper for loading translations
import enChat from "@/languages/en/chat.json";
import thChat from "@/languages/th/chat.json";

export type LanguageCode = "en" | "th";

interface Translations {
  language: {
    name: string;
    code: string;
  };
  common: Record<string, string>;
  sidebar: Record<string, string>;
  header: Record<string, string>;
  messages: Record<string, string>;
  input: Record<string, string>;
  apiKey: Record<string, string>;
  loginDialog: Record<string, string>;
  modelSelector: Record<string, string>;
  preset: Record<string, string>;
  promptEditor: Record<string, string>;
  userSettings: Record<string, string>;
  message: Record<string, string>;
  archive: Record<string, string>;
  conversationSettings: Record<string, string>;
  notification: Record<string, string>;
  chat: Record<string, string>;
  auth: Record<string, string>;
  errors: Record<string, string>;
  analytics: Record<string, string>;
}

const translations: Record<LanguageCode, Translations> = {
  en: { ...enChat } as Translations,
  th: { ...thChat } as Translations,
};

/**
 * Get translation object for a specific language
 */
export function getTranslations(lang: LanguageCode = "en"): Translations {
  return translations[lang] || translations.en;
}

/**
 * Get translated string by key path (e.g., "chat.title", "common.save")
 */
export function t(keyPath: string, lang: LanguageCode = "en"): string {
  const trans = getTranslations(lang);
  const keys = keyPath.split(".");
  let value: any = trans;

  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) {
      console.warn(`Translation key not found: ${keyPath} for language: ${lang}`);
      return keyPath;
    }
  }

  return value as string;
}

export default { getTranslations, t };
