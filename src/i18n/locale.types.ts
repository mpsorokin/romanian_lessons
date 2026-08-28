export const SUPPORTED_LOCALES = ["en", "ru"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "en";

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value === "en" || value === "ru";
}
