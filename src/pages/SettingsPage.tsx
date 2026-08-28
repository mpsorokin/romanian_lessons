import { ArrowRight, Database, Globe, Moon, SlidersHorizontal, Tag, Trash, TextAa } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useProgressActions } from "@/features/reading/useProgress";
import { useCardProgressActions } from "@/features/cards/useCardProgress";
import { useReaderSettings } from "@/features/reader/ReaderSettingsProvider";
import i18n from "@/i18n";
import type { AppLocale } from "@/i18n/locale.types";

export function SettingsPage() {
  const { t } = useTranslation();
  const { resetProgress } = useProgressActions();
  const { resetCardProgress } = useCardProgressActions();
  const { settings } = useReaderSettings();
  const currentLocale = i18n.language as AppLocale;

  const handleResetReading = () => {
    if (window.confirm(t("settings.resetReadingConfirm"))) resetProgress();
  };
  const handleResetCards = () => {
    if (window.confirm(t("settings.resetCardsConfirm"))) resetCardProgress();
  };

  const setLocale = (locale: AppLocale) => {
    void i18n.changeLanguage(locale);
  };

  return (
    <AppShell className="settings-shell" title={t("settings.title")} showBack>
      <section className="settings-section">
        <p className="eyebrow">{t("settings.interfaceEyebrow")}</p>
        <div className="dark-card settings-list">
          <div className="settings-language-row">
            <span>
              <Globe size={18} /> {t("settings.language")}
            </span>
            <div className="settings-language" role="group" aria-label={t("settings.language")}>
              <button
                type="button"
                className={currentLocale === "en" ? "active" : undefined}
                onClick={() => setLocale("en")}
              >
                {t("settings.languageEn")}
              </button>
              <button
                type="button"
                className={currentLocale === "ru" ? "active" : undefined}
                onClick={() => setLocale("ru")}
              >
                {t("settings.languageRu")}
              </button>
            </div>
          </div>
        </div>
      </section>
      <section className="settings-section">
        <p className="eyebrow">{t("settings.readingPreferencesEyebrow")}</p>
        <div className="dark-card settings-list">
          <Link to="/settings/reader">
            <span>
              <SlidersHorizontal size={18} /> {t("settings.sizeAndSpacing")}
            </span>
            <strong>{t("settings.sizeAndSpacingValue", { fontSize: settings.fontSize, lineHeight: settings.lineHeight })}</strong>
            <ArrowRight size={16} />
          </Link>
          <Link to="/settings/reader">
            <span>
              <Moon size={18} /> {t("settings.readingTheme")}
            </span>
            <strong>{settings.theme === "paper" ? t("settings.themePaper") : t("settings.themeDark")}</strong>
            <ArrowRight size={16} />
          </Link>
          <div>
            <span>
              <TextAa size={18} /> {t("settings.font")}
            </span>
            <strong>Lora (Serif)</strong>
          </div>
        </div>
      </section>
      <section className="settings-section">
        <p className="eyebrow">{t("settings.dataEyebrow")}</p>
        <div className="dark-card settings-list">
          <div>
            <span>
              <Database size={18} /> {t("settings.progressStorage")}
            </span>
            <strong>{t("settings.localStorage")}</strong>
          </div>
          <button type="button" className="settings-danger" onClick={handleResetReading}>
            <span>
              <Trash size={18} /> {t("settings.resetReading")}
            </span>
            <ArrowRight size={16} />
          </button>
          <button type="button" className="settings-danger" onClick={handleResetCards}>
            <span>
              <Trash size={18} /> {t("settings.resetCards")}
            </span>
            <ArrowRight size={16} />
          </button>
        </div>
      </section>
      <section className="settings-section">
        <p className="eyebrow">{t("settings.aboutEyebrow")}</p>
        <div className="dark-card settings-list">
          <div>
            <span>
              <Tag size={18} /> {t("common.version")}
            </span>
            <strong>{__APP_VERSION__}</strong>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
