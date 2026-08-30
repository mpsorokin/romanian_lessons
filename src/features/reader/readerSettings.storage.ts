import { isRecord, readStored, writeStored } from "@/lib/storage";
import {
  DEFAULT_READER_SETTINGS,
  asReaderTheme,
  clampFontSize,
  clampLineHeight,
  type ReaderSettings,
} from "@/features/reader/readerSettings.types";

export const READER_SETTINGS_STORAGE_KEY = "calea:reader-settings:v1";

/** Never returns `null`: any recognisable object yields settings, clamped field by field. */
export function parseReaderSettings(value: unknown): ReaderSettings | null {
  if (!isRecord(value)) return null;

  const fontSize = Number(value.fontSize);
  const lineHeight = Number(value.lineHeight);
  return {
    fontSize: Number.isFinite(fontSize) ? clampFontSize(fontSize) : DEFAULT_READER_SETTINGS.fontSize,
    lineHeight: Number.isFinite(lineHeight) ? clampLineHeight(lineHeight) : DEFAULT_READER_SETTINGS.lineHeight,
    theme: asReaderTheme(value.theme),
  };
}

export function readReaderSettings(): ReaderSettings {
  return readStored(READER_SETTINGS_STORAGE_KEY, parseReaderSettings, () => DEFAULT_READER_SETTINGS);
}

export function writeReaderSettings(settings: ReaderSettings): void {
  writeStored(READER_SETTINGS_STORAGE_KEY, settings);
}
