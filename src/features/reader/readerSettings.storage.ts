import {
  DEFAULT_READER_SETTINGS,
  asReaderTheme,
  clampFontSize,
  clampLineHeight,
  type ReaderSettings,
} from "@/features/reader/readerSettings.types";

export const READER_SETTINGS_STORAGE_KEY = "calea:reader-settings:v1";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function readReaderSettings(): ReaderSettings {
  try {
    const raw = window.localStorage.getItem(READER_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_READER_SETTINGS;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return DEFAULT_READER_SETTINGS;

    const fontSize = Number(parsed.fontSize);
    const lineHeight = Number(parsed.lineHeight);
    return {
      fontSize: Number.isFinite(fontSize) ? clampFontSize(fontSize) : DEFAULT_READER_SETTINGS.fontSize,
      lineHeight: Number.isFinite(lineHeight) ? clampLineHeight(lineHeight) : DEFAULT_READER_SETTINGS.lineHeight,
      theme: asReaderTheme(parsed.theme),
    };
  } catch {
    return DEFAULT_READER_SETTINGS;
  }
}

export function writeReaderSettings(settings: ReaderSettings): void {
  try {
    window.localStorage.setItem(READER_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Settings remain available for the current session when storage is unavailable.
  }
}
