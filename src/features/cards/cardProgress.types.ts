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
  version: 1;
  cards: Record<string, CardProgressRecord>;
  /** Card IDs in first-added order for the dedicated review queue. */
  needToReview: string[];
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
