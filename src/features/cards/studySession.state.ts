import type { CardResult } from "@/features/cards/cardProgress.types";
import type { StudyCard } from "@/features/cards/cards";

export interface SessionState {
  /** `null` means no session is running — the deck overview or summary shows instead. */
  cards: StudyCard[] | null;
  index: number;
  revealed: boolean;
  remembered: number;
  repeat: number;
  /** Cards graded "repeat" so far in the running session. */
  difficult: StudyCard[];
  /** Difficult cards of the session being summarised; feeds "Повторить сложные". */
  lastDifficult: StudyCard[];
  summaryVisible: boolean;
}

export type SessionEvent =
  | { type: "start"; cards: StudyCard[] }
  | { type: "reveal" }
  | { type: "answer"; result: CardResult; card: StudyCard }
  | { type: "leave" };

export const IDLE: SessionState = {
  cards: null,
  index: 0,
  revealed: false,
  remembered: 0,
  repeat: 0,
  difficult: [],
  lastDifficult: [],
  summaryVisible: false,
};

/**
 * One reducer rather than seven `useState`s: answering a card has to move the
 * index, the counters, the difficult list and the reveal flag together, and
 * keeping those in separate setters is what let the previous "finish" and
 * "leave" paths drift apart.
 *
 * Lives outside the page component so it can be exercised directly — it is the
 * one piece of card logic whose mistakes are invisible on screen.
 */
export function sessionReducer(state: SessionState, event: SessionEvent): SessionState {
  switch (event.type) {
    case "start":
      return { ...IDLE, lastDifficult: state.lastDifficult, cards: event.cards };

    case "reveal":
      return { ...state, revealed: true };

    case "answer": {
      if (!state.cards) return state;
      const remembered = state.remembered + (event.result === "remembered" ? 1 : 0);
      const repeat = state.repeat + (event.result === "repeat" ? 1 : 0);
      const difficult = event.result === "repeat" ? [...state.difficult, event.card] : state.difficult;
      if (state.index >= state.cards.length - 1) {
        return { ...state, cards: null, remembered, repeat, difficult: [], lastDifficult: difficult, summaryVisible: true };
      }
      return { ...state, index: state.index + 1, revealed: false, remembered, repeat, difficult };
    }

    case "leave":
      return IDLE;
  }
}
