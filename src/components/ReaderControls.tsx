import { useReaderSettings } from "../features/reader-settings/ReaderSettingsProvider";

export function ReaderControls() {
  const { settings, setFontSize } = useReaderSettings();
  return (
    <div className="reader-controls" aria-label="Размер текста">
      <button type="button" onClick={() => setFontSize(settings.fontSize - 1)} aria-label="Уменьшить текст" disabled={settings.fontSize <= 18}>A−</button>
      <span>{settings.fontSize}</span>
      <button type="button" onClick={() => setFontSize(settings.fontSize + 1)} aria-label="Увеличить текст" disabled={settings.fontSize >= 26}>A<sup>+</sup></button>
    </div>
  );
}
