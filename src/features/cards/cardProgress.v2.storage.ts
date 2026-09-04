import { isDate, isRecord, mergeRecords, readStored, writeStored } from "@/lib/storage";
import { createInitialCardProgress, type CardProgressRecord, type CardProgressStateV2, type ReviewLogEntry, type ScheduledCardProgressRecord, type TodaySessionState } from "@/features/cards/cardProgress.types";
import { dateKey, initialDailyUsage, pruneReviewLog } from "@/features/cards/scheduler";
import { parseCardProgressState, CARD_PROGRESS_STORAGE_KEY as LEGACY_CARD_PROGRESS_STORAGE_KEY } from "@/features/cards/cardProgress.storage";

export const CARD_PROGRESS_V2_STORAGE_KEY = "calea:cards:v2";
export const CARD_MIGRATION_NOTICE_STORAGE_KEY = "calea:cards:v2:migration-notice-shown";

const integer = (value: unknown, fallback = 0) => {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback;
};

const stringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0))];
};

function parseRecord(value: unknown): ScheduledCardProgressRecord | null {
  if (!isRecord(value) || !isDate(value.updatedAt) || !isDate(value.dueDate)) return null;
  const attempts = integer(value.attempts);
  return {
    status: value.status === "known" ? "known" : "learning",
    attempts,
    remembered: Math.min(integer(value.remembered), attempts),
    updatedAt: value.updatedAt,
    intervalIndex: Math.min(5, integer(value.intervalIndex)),
    dueDate: value.dueDate,
    successfulReviews: integer(value.successfulReviews),
    firstStudiedAt: typeof value.firstStudiedAt === "string" ? value.firstStudiedAt : null,
    lastReviewedAt: typeof value.lastReviewedAt === "string" ? value.lastReviewedAt : null,
    lastScheduledReviewAt: typeof value.lastScheduledReviewAt === "string" ? value.lastScheduledReviewAt : null,
  };
}

function parseRecords(value: unknown): Record<string, ScheduledCardProgressRecord> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([id, raw]) => {
    const record = parseRecord(raw);
    return record ? [[id, record]] : [];
  }));
}

function parseLog(value: unknown): ReviewLogEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw) => {
    if (!isRecord(raw) || typeof raw.id !== "string" || typeof raw.cardId !== "string" || !isDate(raw.answeredAt)) return [];
    const type = raw.type === "new" || raw.type === "scheduled" || raw.type === "retry" || raw.type === "early" ? raw.type : null;
    if (!type || (raw.result !== "remembered" && raw.result !== "repeat")) return [];
    return [{
      id: raw.id,
      cardId: raw.cardId,
      result: raw.result,
      type,
      answeredAt: raw.answeredAt,
      previousAnsweredAt: typeof raw.previousAnsweredAt === "string" ? raw.previousAnsweredAt : null,
      pauseHours: Math.max(0, Number(raw.pauseHours) || 0),
      qualifiesForRecall: raw.qualifiesForRecall === true,
    }];
  });
}

function parseSession(value: unknown): TodaySessionState | null {
  if (!isRecord(value) || typeof value.id !== "string" || !isDate(value.startedAt)) return null;
  return {
    id: value.id,
    // Retry cards are intentionally duplicated in the persisted queue. Keep
    // insertion order here; only the difficult-card list is a set.
    cardIds: Array.isArray(value.cardIds)
      ? value.cardIds.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
      : [],
    index: Math.max(0, integer(value.index)),
    revealed: value.revealed === true,
    retryCounts: isRecord(value.retryCounts) ? Object.fromEntries(Object.entries(value.retryCounts).map(([id, count]) => [id, Math.min(2, integer(count))])) : {},
    remembered: integer(value.remembered),
    repeat: integer(value.repeat),
    errors: integer(value.errors),
    newCount: integer(value.newCount),
    firstRecallCount: integer(value.firstRecallCount),
    retryCount: integer(value.retryCount),
    difficult: stringList(value.difficult),
    startedAt: value.startedAt,
    primaryTotal: integer(value.primaryTotal),
  };
}

export function createInitialCardProgressV2(today = dateKey(new Date())): CardProgressStateV2 {
  return {
    version: 2,
    cards: {},
    needToReview: [],
    startedDeckIds: [],
    daily: initialDailyUsage(today),
    reviewLog: [],
    activeSession: null,
    migratedLegacy: false,
    resetAt: null,
  };
}

export function parseCardProgressStateV2(value: unknown): CardProgressStateV2 | null {
  if (!isRecord(value) || value.version !== 2) return null;
  const daily = isRecord(value.daily) && typeof value.daily.date === "string"
    ? { date: value.daily.date, newIntroduced: integer(value.daily.newIntroduced), primaryCompleted: value.daily.primaryCompleted === true }
    : initialDailyUsage();
  return {
    version: 2,
    cards: parseRecords(value.cards),
    needToReview: stringList(value.needToReview),
    startedDeckIds: stringList(value.startedDeckIds),
    daily,
    reviewLog: parseLog(value.reviewLog),
    activeSession: parseSession(value.activeSession),
    migratedLegacy: value.migratedLegacy === true,
    resetAt: typeof value.resetAt === "string" ? value.resetAt : null,
  };
}

export function migrateLegacyProgress(legacy: CardProgressRecord | Record<string, CardProgressRecord> | null, needToReview: string[] = []): CardProgressStateV2 {
  const source = isRecord(legacy) ? legacy : {};
  const today = dateKey(new Date());
  const cards: Record<string, ScheduledCardProgressRecord> = {};
  for (const [id, old] of Object.entries(source)) {
    if (!isRecord(old) || !isDate(old.updatedAt)) continue;
    cards[id] = {
      status: "learning",
      attempts: integer(old.attempts),
      remembered: Math.min(integer(old.remembered), integer(old.attempts)),
      updatedAt: old.updatedAt,
      intervalIndex: 0,
      dueDate: today,
      successfulReviews: 0,
      firstStudiedAt: null,
      lastReviewedAt: null,
      lastScheduledReviewAt: null,
    };
  }
  return {
    ...createInitialCardProgressV2(today),
    cards,
    needToReview: stringList(needToReview),
    startedDeckIds: [...new Set(Object.keys(cards).map((id) => id.split(":")[0]))],
    migratedLegacy: Object.keys(cards).length > 0,
    resetAt: null,
  };
}

export function readCardProgressV2(): CardProgressStateV2 {
  const current = readStored(CARD_PROGRESS_V2_STORAGE_KEY, parseCardProgressStateV2, () => null);
  if (current) return current;
  const legacy = readStored(LEGACY_CARD_PROGRESS_STORAGE_KEY, parseCardProgressState, createInitialCardProgress);
  const migrated = migrateLegacyProgress(legacy.cards, legacy.needToReview);
  // Keep v1 as the source copy, but persist the translated state so the
  // migration is one-time and the new scheduler has a stable store.
  writeStored(CARD_PROGRESS_V2_STORAGE_KEY, migrated);
  return migrated;
}

export function writeCardProgressV2(progress: CardProgressStateV2): void {
  writeStored(CARD_PROGRESS_V2_STORAGE_KEY, progress);
}

/** Empty state carrying a tombstone, so another tab cannot merge the old cards back in. */
export function createResetCardProgressV2(): CardProgressStateV2 {
  return { ...createInitialCardProgressV2(), resetAt: new Date().toISOString() };
}

export function mergeCardProgressV2(local: CardProgressStateV2, incoming: CardProgressStateV2): CardProgressStateV2 {
  if (local.resetAt && (!incoming.resetAt || incoming.resetAt < local.resetAt)) return local;
  if (incoming.resetAt && incoming.resetAt > (local.resetAt ?? "")) return incoming;
  // A second tab can write the initial empty migration snapshot while this
  // tab already has progress. It is not a reset unless it carries resetAt.
  if (!incoming.resetAt && !Object.keys(incoming.cards).length && incoming.reviewLog.length === 0 && Object.keys(local.cards).length) return local;
  // Dedupe by id, keeping the first occurrence — local entries win, then the
  // incoming ones this tab has not seen. A Map keeps that insertion order.
  const byId = new Map<string, ReviewLogEntry>();
  for (const entry of local.reviewLog) if (!byId.has(entry.id)) byId.set(entry.id, entry);
  for (const entry of incoming.reviewLog) if (!byId.has(entry.id)) byId.set(entry.id, entry);
  return {
    ...incoming,
    cards: mergeRecords(local.cards, incoming.cards),
    reviewLog: pruneReviewLog([...byId.values()]),
  };
}
