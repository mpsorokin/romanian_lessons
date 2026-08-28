import { useTranslation } from "react-i18next";
import { useReaderSettings } from "@/features/reader/ReaderSettingsProvider";

export function ReaderControls() {
  const { t } = useTranslation();
  const { settings, setFontSize } = useReaderSettings();
  return (
    <div className="reader-controls" aria-label={t("reader.fontSizeControls")}>
      <button type="button" onClick={() => setFontSize(settings.fontSize - 1)} aria-label={t("reader.decreaseText")} disabled={settings.fontSize <= 18}>
        A−
      </button>
      <span>{settings.fontSize}</span>
      <button type="button" onClick={() => setFontSize(settings.fontSize + 1)} aria-label={t("reader.increaseText")} disabled={settings.fontSize >= 26}>
        A<sup>+</sup>
      </button>
    </div>
  );
}
