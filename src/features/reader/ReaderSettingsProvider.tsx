import { createContext, useCallback, useContext, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { readReaderSettings, writeReaderSettings } from "@/features/reader/readerSettings.storage";
import {
  DEFAULT_READER_SETTINGS,
  asReaderTheme,
  clampFontSize,
  clampLineHeight,
  type ReaderSettings,
  type ReaderTheme,
} from "@/features/reader/readerSettings.types";

interface ReaderSettingsContextValue {
  settings: ReaderSettings;
  updateSettings: (next: ReaderSettings) => void;
  setFontSize: (fontSize: number) => void;
  setLineHeight: (lineHeight: number) => void;
  setTheme: (theme: ReaderTheme) => void;
}

const ReaderSettingsContext = createContext<ReaderSettingsContextValue | null>(null);

export function ReaderSettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<ReaderSettings>(() => readReaderSettings());
  const settingsRef = useRef(settings);

  const apply = useCallback((next: ReaderSettings) => {
    settingsRef.current = next;
    writeReaderSettings(next);
    setSettings(next);
  }, []);

  const value = useMemo<ReaderSettingsContextValue>(
    () => ({
      settings,
      updateSettings: (next) =>
        apply({
          fontSize: clampFontSize(next.fontSize),
          lineHeight: clampLineHeight(next.lineHeight),
          theme: asReaderTheme(next.theme),
        }),
      setFontSize: (fontSize) => apply({ ...settingsRef.current, fontSize: clampFontSize(fontSize) }),
      setLineHeight: (lineHeight) => apply({ ...settingsRef.current, lineHeight: clampLineHeight(lineHeight) }),
      setTheme: (theme) => apply({ ...settingsRef.current, theme }),
    }),
    [settings, apply],
  );

  return <ReaderSettingsContext.Provider value={value}>{children}</ReaderSettingsContext.Provider>;
}

export function useReaderSettings() {
  const context = useContext(ReaderSettingsContext);
  if (!context) throw new Error("useReaderSettings must be used inside ReaderSettingsProvider.");
  return context;
}

export { DEFAULT_READER_SETTINGS };
