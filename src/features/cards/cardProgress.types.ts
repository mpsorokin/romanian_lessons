export type CardStatus = "learning" | "known";

export interface CardProgressRecord {
  status: CardStatus;
  attempts: number;
  remembered: number;
  updatedAt: string;
}

export interface CardProgressState {
  version: 1;
  cards: Record<string, CardProgressRecord>;
}

export function createInitialCardProgress(): CardProgressState {
  return { version: 1, cards: {} };
}
