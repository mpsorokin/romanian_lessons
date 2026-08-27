import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { readReaderSettings, writeReaderSettings } from "./readerSettings.storage";
import { DEFAULT_READER_SETTINGS, type ReaderSettings, type ReaderTheme } from "./readerSettings.types";

interface ReaderSettingsContextValue {
  settings: ReaderSettings;
  updateSettings: (next: ReaderSettings) => void;
  setFontSize: (fontSize: number) => void;
  setLineHeight: (lineHeight: number) => void;
  setTheme: (theme: ReaderTheme) => void;
}

const ReaderSettingsContext = createContext<ReaderSettingsContextValue | null>(null);

const clampFontSize = (value: number) => Math.min(26, Math.max(18, Math.round(value)));
const clampLineHeight = (value: number) => Math.min(2, Math.max(1.4, Math.round(value * 20) / 20));

export function ReaderSettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<ReaderSettings>(() => readReaderSettings());

  useEffect(() => {
    writeReaderSettings(settings);
  }, [settings]);

  const updateSettings = useCallback((next: ReaderSettings) => {
    setSettings({
      fontSize: clampFontSize(next.fontSize),
      lineHeight: clampLineHeight(next.lineHeight),
      theme: next.theme === "dark" ? "dark" : "paper",
    });
  }, []);

  const setFontSize = useCallback((fontSize: number) => {
    setSettings((current) => ({ ...current, fontSize: clampFontSize(fontSize) }));
  }, []);

  const setLineHeight = useCallback((lineHeight: number) => {
    setSettings((current) => ({ ...current, lineHeight: clampLineHeight(lineHeight) }));
  }, []);

  const setTheme = useCallback((theme: ReaderTheme) => {
    setSettings((current) => ({ ...current, theme }));
  }, []);

  const value = useMemo(
    () => ({ settings, updateSettings, setFontSize, setLineHeight, setTheme }),
    [settings, updateSettings, setFontSize, setLineHeight, setTheme],
  );

  return <ReaderSettingsContext.Provider value={value}>{children}</ReaderSettingsContext.Provider>;
}

export function useReaderSettings() {
  const context = useContext(ReaderSettingsContext);
  if (!context) throw new Error("useReaderSettings must be used inside ReaderSettingsProvider.");
  return context;
}

export { DEFAULT_READER_SETTINGS };
