import { isDate, isRecord, mergeRecords, readStored, removeStored, writeStored } from "@/lib/storage";
import { createInitialCardProgress, type CardProgressRecord, type CardProgressState } from "@/features/cards/cardProgress.types";

export const CARD_PROGRESS_STORAGE_KEY = "calea:cards:v1";

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

function parseNeedToReview(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const id of value) {
    if (typeof id !== "string" || !id.trim() || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }

  return result;
}

export function parseCardProgressState(value: unknown): CardProgressState | null {
  if (!isRecord(value) || value.version !== 1) return null;
  return { version: 1, cards: parseCards(value.cards), needToReview: parseNeedToReview(value.needToReview) };
}

export function readCardProgress(): CardProgressState {
  return readStored(CARD_PROGRESS_STORAGE_KEY, parseCardProgressState, createInitialCardProgress);
}

export function writeCardProgress(progress: CardProgressState): void {
  writeStored(CARD_PROGRESS_STORAGE_KEY, progress);
}

export function clearCardProgress(): void {
  removeStored(CARD_PROGRESS_STORAGE_KEY);
}

/**
 * Same rule as the reading store: the other tab's snapshot decides what exists,
 * per-card conflicts resolve by `updatedAt`. The review queue is taken wholesale
 * so that clearing a card there is not undone by this tab remembering it.
 */
export function mergeCardProgress(local: CardProgressState, incoming: CardProgressState): CardProgressState {
  return {
    version: 1,
    cards: mergeRecords(local.cards, incoming.cards),
    needToReview: incoming.needToReview,
  };
}
