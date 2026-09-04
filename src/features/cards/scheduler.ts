import type {
  CardResult,
  DailyCardUsage,
  ReviewAttemptType,
  ReviewLogEntry,
  ScheduledCardProgressRecord,
} from "@/features/cards/cardProgress.types";

export const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 60] as const;
export const TODAY_LIMIT = 20;
export const TODAY_NEW_LIMIT = 5;

export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): string {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return dateKey(next);
}

export function hoursBetween(previous: string | null, current: Date): number {
  if (!previous) return 0;
  const timestamp = Date.parse(previous);
  if (!Number.isFinite(timestamp)) return 0;
  return Math.max(0, (current.getTime() - timestamp) / 3_600_000);
}

export function isDue(card: ScheduledCardProgressRecord, today = dateKey(new Date())): boolean {
  return card.dueDate <= today;
}

export function createScheduledRecord(now: Date, result: CardResult): ScheduledCardProgressRecord {
  const answeredAt = now.toISOString();
  return {
    status: "learning",
    attempts: 1,
    remembered: result === "remembered" ? 1 : 0,
    updatedAt: answeredAt,
    intervalIndex: 0,
    dueDate: addDays(now, 1),
    successfulReviews: 0,
    firstStudiedAt: answeredAt,
    lastReviewedAt: answeredAt,
    lastScheduledReviewAt: result === "remembered" ? answeredAt : null,
  };
}

export function classifyAttempt(
  card: ScheduledCardProgressRecord | undefined,
  now: Date,
  mode: "today" | "manual" = "today",
  retry = false,
): ReviewAttemptType {
  if (!card) return "new";
  if (retry) return "retry";
  if (mode === "today" && isDue(card, dateKey(now)) && dateKeyFromIso(card.lastScheduledReviewAt) !== dateKey(now)) {
    return "scheduled";
  }
  return "early";
}

function dateKeyFromIso(value: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : dateKey(parsed);
}

export interface ReviewTransition {
  record: ScheduledCardProgressRecord;
  attempt: ReviewAttemptType;
  log: Omit<ReviewLogEntry, "id">;
  removeFromReviewQueue: boolean;
}

/** Apply exactly one answer. Same-day retries and early practice never advance the interval. */
export function applyReview(
  previous: ScheduledCardProgressRecord | undefined,
  result: CardResult,
  now: Date,
  mode: "today" | "manual" = "today",
  retry = false,
): ReviewTransition {
  const answeredAt = now.toISOString();
  const attempt = classifyAttempt(previous, now, mode, retry);
  const previousAnsweredAt = previous?.lastReviewedAt ?? null;
  const pauseHours = hoursBetween(previousAnsweredAt, now);
  const base = previous ?? createScheduledRecord(now, result);
  const attempts = (previous?.attempts ?? 0) + 1;
  const remembered = (previous?.remembered ?? 0) + (result === "remembered" ? 1 : 0);

  if (!previous) {
    const record = { ...base, attempts, remembered, updatedAt: answeredAt };
    return {
      record,
      attempt,
      log: { cardId: "", result, type: attempt, answeredAt, previousAnsweredAt, pauseHours, qualifiesForRecall: false },
      removeFromReviewQueue: false,
    };
  }

  if (result === "repeat") {
    const record: ScheduledCardProgressRecord = {
      ...previous,
      status: "learning",
      attempts,
      remembered,
      intervalIndex: 0,
      dueDate: addDays(now, 1),
      successfulReviews: 0,
      updatedAt: answeredAt,
      firstStudiedAt: previous.firstStudiedAt ?? (attempt === "scheduled" ? answeredAt : null),
      lastReviewedAt: answeredAt,
      lastScheduledReviewAt: attempt === "scheduled" ? answeredAt : previous.lastScheduledReviewAt,
    };
    return {
      record,
      attempt,
      log: { cardId: "", result, type: attempt, answeredAt, previousAnsweredAt, pauseHours, qualifiesForRecall: false },
      removeFromReviewQueue: false,
    };
  }

  const scheduledToday = attempt === "scheduled" && dateKeyFromIso(previous.lastScheduledReviewAt) !== dateKey(now);
  const advances = scheduledToday || attempt === "new";
  const nextIndex = attempt === "new"
    ? 0
    : advances
      ? Math.min(REVIEW_INTERVALS.length - 1, previous.intervalIndex + 1)
      : previous.intervalIndex;
  const successfulReviews = advances ? previous.successfulReviews + 1 : previous.successfulReviews;
  const record: ScheduledCardProgressRecord = {
    ...previous,
    status: successfulReviews >= 3 ? "known" : "learning",
    attempts,
    remembered,
    intervalIndex: nextIndex,
    dueDate: advances ? addDays(now, REVIEW_INTERVALS[nextIndex]) : previous.dueDate,
    successfulReviews,
    updatedAt: answeredAt,
    firstStudiedAt: previous.firstStudiedAt ?? (attempt === "scheduled" ? answeredAt : null),
    lastReviewedAt: answeredAt,
    lastScheduledReviewAt: advances && attempt === "scheduled" ? answeredAt : previous.lastScheduledReviewAt,
  };
  return {
    record,
    attempt,
    log: {
      cardId: "",
      result,
      type: attempt,
      answeredAt,
      previousAnsweredAt,
      pauseHours,
      qualifiesForRecall: attempt === "scheduled" && pauseHours >= 24,
    },
    removeFromReviewQueue: attempt === "scheduled",
  };
}

export function initialDailyUsage(today = dateKey(new Date())): DailyCardUsage {
  return { date: today, newIntroduced: 0, primaryCompleted: false };
}

export function normalizeDailyUsage(daily: DailyCardUsage | undefined, today = dateKey(new Date())): DailyCardUsage {
  return daily?.date === today ? daily : initialDailyUsage(today);
}

export const REVIEW_LOG_LIMIT = 5000;

export function pruneReviewLog(log: ReviewLogEntry[], now = new Date()): ReviewLogEntry[] {
  const cutoff = now.getTime() - 90 * 24 * 3_600_000;
  // The common case is an append to an already-pruned log: skip the copies.
  const expired = log.some((entry) => Date.parse(entry.answeredAt) < cutoff);
  if (!expired && log.length <= REVIEW_LOG_LIMIT) return log;
  const kept = expired ? log.filter((entry) => Date.parse(entry.answeredAt) >= cutoff) : log;
  return kept.length > REVIEW_LOG_LIMIT ? kept.slice(-REVIEW_LOG_LIMIT) : kept;
}

export function makeReviewLogId(cardId: string, answeredAt: string): string {
  return `${cardId}:${answeredAt}`;
}
