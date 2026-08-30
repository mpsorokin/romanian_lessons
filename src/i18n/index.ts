import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { readLocale, writeLocale } from "@/i18n/locale.storage";
import { DEFAULT_LOCALE, isAppLocale } from "@/i18n/locale.types";
import en from "@/i18n/locales/en.json";
import ru from "@/i18n/locales/ru.json";

function syncDocumentLanguage() {
  const locale = isAppLocale(i18n.language) ? i18n.language : DEFAULT_LOCALE;
  document.documentElement.lang = locale;
  document.title = i18n.t("meta.title");
  // `index.html` ships an English description for crawlers; follow the UI language after boot.
  document.querySelector('meta[name="description"]')?.setAttribute("content", i18n.t("meta.description"));
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: readLocale(),
  fallbackLng: DEFAULT_LOCALE,
  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (locale) => {
  if (isAppLocale(locale)) writeLocale(locale);
  syncDocumentLanguage();
});

syncDocumentLanguage();

export default i18n;
