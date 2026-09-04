export type CardStatus = "learning" | "known";

/** How the learner graded a card in a study session. */
export type CardResult = "remembered" | "repeat";

export interface CardProgressRecord {
  status: CardStatus;
  attempts: number;
  remembered: number;
  updatedAt: string;
}

export interface CardProgressState {
  version: 1 | 2;
  cards: Record<string, CardProgressRecord>;
  /** Card IDs in first-added order for the dedicated review queue. */
  needToReview: string[];
}

export type ReviewAttemptType = "new" | "scheduled" | "retry" | "early";

export interface ScheduledCardProgressRecord extends CardProgressRecord {
  /** Index of the interval currently scheduled for the next review. */
  intervalIndex: number;
  dueDate: string;
  successfulReviews: number;
  firstStudiedAt: string | null;
  lastReviewedAt: string | null;
  lastScheduledReviewAt: string | null;
}

export interface ReviewLogEntry {
  id: string;
  cardId: string;
  result: CardResult;
  type: ReviewAttemptType;
  answeredAt: string;
  previousAnsweredAt: string | null;
  pauseHours: number;
  qualifiesForRecall: boolean;
}

export interface TodaySessionState {
  id: string;
  cardIds: string[];
  index: number;
  revealed: boolean;
  retryCounts: Record<string, number>;
  remembered: number;
  repeat: number;
  errors: number;
  newCount: number;
  firstRecallCount: number;
  retryCount: number;
  difficult: string[];
  startedAt: string;
  primaryTotal: number;
}

export interface DailyCardUsage {
  date: string;
  newIntroduced: number;
  primaryCompleted: boolean;
}

export interface CardProgressStateV2 {
  version: 2;
  cards: Record<string, ScheduledCardProgressRecord>;
  needToReview: string[];
  startedDeckIds: string[];
  daily: DailyCardUsage;
  reviewLog: ReviewLogEntry[];
  activeSession: TodaySessionState | null;
  migratedLegacy: boolean;
  /** Tombstone used so a reset in another tab cannot resurrect cards or logs. */
  resetAt: string | null;
}

export function isCardProgressV2(value: CardProgressState | CardProgressStateV2): value is CardProgressStateV2 {
  return value.version === 2;
}

/** Deck-level (or whole-collection) rollup of card statuses. */
export interface CardDeckProgress {
  total: number;
  known: number;
  learning: number;
  newCount: number;
  percent: number;
}

export function createInitialCardProgress(): CardProgressState {
  return { version: 1, cards: {}, needToReview: [] };
}
