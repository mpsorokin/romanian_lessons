export type ReaderTheme = "paper" | "dark";

export interface ReaderSettings {
  fontSize: number;
  lineHeight: number;
  theme: ReaderTheme;
}

export const MIN_FONT_SIZE = 18;
export const MAX_FONT_SIZE = 26;

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  fontSize: 20,
  lineHeight: 1.65,
  theme: "dark",
};

/** Shared by the provider and by storage so a stored value can never render as `20.5px`. */
export const clampFontSize = (value: number): number =>
  Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, Math.round(value)));

export const clampLineHeight = (value: number): number =>
  Math.min(2, Math.max(1.4, Math.round(value * 20) / 20));

export const asReaderTheme = (value: unknown): ReaderTheme => (value === "dark" ? "dark" : "paper");
