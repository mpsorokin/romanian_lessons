import { ArrowRight, Database, Export, Globe, Moon, SlidersHorizontal, Tag, Trash, TextAa, Upload } from "@phosphor-icons/react";
import { useRef, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { createProgressBackup, downloadProgressBackup, parseProgressBackup } from "@/features/backup/progressBackup";
import { useCardProgressActions, useCardProgressState } from "@/features/cards/useCardProgress";
import { useReaderSettings } from "@/features/reader/ReaderSettingsProvider";
import { useProgressActions } from "@/features/progress/useProgress";
import i18n from "@/i18n";
import type { AppLocale } from "@/i18n/locale.types";

export function SettingsPage() {
  const { t } = useTranslation();
  const { getProgressSnapshot, resetProgress, replaceProgress } = useProgressActions();
  const cardProgress = useCardProgressState();
  const { resetCardProgress, replaceCardProgress } = useCardProgressActions();
  const { settings } = useReaderSettings();
  const currentLocale = i18n.language as AppLocale;
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleResetReading = () => {
    if (window.confirm(t("settings.resetReadingConfirm"))) resetProgress();
  };
  const handleResetCards = () => {
    if (window.confirm(t("settings.resetCardsConfirm"))) resetCardProgress();
  };

  const handleExportProgress = () => {
    const backup = createProgressBackup(getProgressSnapshot(), cardProgress);
    downloadProgressBackup(backup);
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      window.alert(t("settings.importInvalid"));
      return;
    }

    const backup = parseProgressBackup(parsed);
    if (!backup) {
      window.alert(t("settings.importInvalid"));
      return;
    }

    if (!window.confirm(t("settings.importConfirm"))) return;

    replaceProgress(backup.reading);
    replaceCardProgress(backup.cards);
    window.alert(t("settings.importDone"));
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
          <button type="button" onClick={handleExportProgress}>
            <span>
              <Export size={18} /> {t("settings.exportProgress")}
            </span>
            <ArrowRight size={16} />
          </button>
          <button type="button" onClick={handleImportClick}>
            <span>
              <Upload size={18} /> {t("settings.importProgress")}
            </span>
            <ArrowRight size={16} />
          </button>
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
        <input
          ref={importInputRef}
          type="file"
          accept="application/json"
          hidden
          onChange={handleImportFile}
        />
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
