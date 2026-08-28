import { DEFAULT_LOCALE, type AppLocale, isAppLocale } from "@/i18n/locale.types";

export const LOCALE_STORAGE_KEY = "calea:locale";

export function readLocale(): AppLocale {
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isAppLocale(stored) ? stored : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function writeLocale(locale: AppLocale): void {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Locale remains available for the current session when storage is unavailable.
  }
}
