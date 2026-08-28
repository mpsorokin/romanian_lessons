import { createInitialCardProgress, type CardProgressRecord, type CardProgressState } from "@/features/cards/cardProgress.types";

export const CARD_PROGRESS_STORAGE_KEY = "calea:cards:v1";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isDate = (value: unknown): value is string => typeof value === "string" && value.length > 0;

const positiveInteger = (value: unknown): number => {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
};

function parseCards(value: unknown): Record<string, CardProgressRecord> {
  if (!isRecord(value)) return {};
  const result: Record<string, CardProgressRecord> = {};
  for (const [id, raw] of Object.entries(value)) {
    if (!isRecord(raw) || !isDate(raw.updatedAt)) continue;
    const status = raw.status === "known" ? "known" : raw.status === "learning" ? "learning" : null;
    if (!status) continue;
    result[id] = {
      status,
      attempts: positiveInteger(raw.attempts),
      remembered: Math.min(positiveInteger(raw.remembered), positiveInteger(raw.attempts)),
      updatedAt: raw.updatedAt,
    };
  }
  return result;
}

export function readCardProgress(): CardProgressState {
  try {
    const raw = window.localStorage.getItem(CARD_PROGRESS_STORAGE_KEY);
    if (!raw) return createInitialCardProgress();
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== 1) return createInitialCardProgress();
    return { version: 1, cards: parseCards(parsed.cards) };
  } catch {
    return createInitialCardProgress();
  }
}

export function writeCardProgress(progress: CardProgressState): void {
  try {
    window.localStorage.setItem(CARD_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Private browsing or disabled storage should not prevent card sessions.
  }
}

export function clearCardProgress(): void {
  try {
    window.localStorage.removeItem(CARD_PROGRESS_STORAGE_KEY);
  } catch {
    // Private browsing or disabled storage should not prevent resetting memory state.
  }
}
