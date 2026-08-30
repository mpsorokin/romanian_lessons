import { createContext, useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import {
  CARD_PROGRESS_STORAGE_KEY,
  clearCardProgress,
  mergeCardProgress,
  parseCardProgressState,
  readCardProgress,
  writeCardProgress,
} from "@/features/cards/cardProgress.storage";
import { subscribeToStorage } from "@/lib/storage";
import { createInitialCardProgress, type CardProgressState, type CardResult, type CardStatus } from "@/features/cards/cardProgress.types";

export interface CardProgressActions {
  getCardStatus: (id: string) => CardStatus | "new";
  markCard: (id: string, result: CardResult) => void;
  removeCardFromReview: (id: string) => void;
  resetCardProgress: () => void;
  replaceCardProgress: (state: CardProgressState) => void;
}

export const CardProgressStateContext = createContext<CardProgressState | null>(null);
export const CardProgressActionsContext = createContext<CardProgressActions | null>(null);

const now = () => new Date().toISOString();

export function CardProgressProvider({ children }: PropsWithChildren) {
  const [progress, setProgress] = useState<CardProgressState>(() => readCardProgress());
  const progressRef = useRef(progress);

  const apply = useCallback((update: (current: CardProgressState) => CardProgressState) => {
    const next = update(progressRef.current);
    if (next === progressRef.current) return;
    progressRef.current = next;
    writeCardProgress(next);
    setProgress(next);
  }, []);

  /** Mirrors the reading store: adopt another tab's write instead of clobbering it. */
  useEffect(
    () =>
      subscribeToStorage(CARD_PROGRESS_STORAGE_KEY, (raw) => {
        let incoming = createInitialCardProgress();
        if (raw !== null) {
          try {
            incoming = parseCardProgressState(JSON.parse(raw) as unknown) ?? incoming;
          } catch {
            return; // Unreadable write from elsewhere: keep what we have.
          }
        }
        const merged = mergeCardProgress(progressRef.current, incoming);
        progressRef.current = merged;
        setProgress(merged);
      }),
    [],
  );

  const actions = useMemo<CardProgressActions>(() => ({
    getCardStatus: (id) => progressRef.current.cards[id]?.status ?? "new",
    markCard: (id, result) => apply((current) => {
      const existing = current.cards[id];
      const attempts = (existing?.attempts ?? 0) + 1;
      const remembered = (existing?.remembered ?? 0) + (result === "remembered" ? 1 : 0);
      const needToReview =
        result === "repeat" && !current.needToReview.includes(id)
          ? [...current.needToReview, id]
          : current.needToReview;
      return {
        version: 1,
        cards: {
          ...current.cards,
          [id]: { status: result === "remembered" ? "known" : "learning", attempts, remembered, updatedAt: now() },
        },
        needToReview,
      };
    }),
    removeCardFromReview: (id) => apply((current) => {
      if (!current.needToReview.includes(id)) return current;
      return { ...current, needToReview: current.needToReview.filter((cardId) => cardId !== id) };
    }),
    resetCardProgress: () => {
      const initial = createInitialCardProgress();
      clearCardProgress();
      progressRef.current = initial;
      setProgress(initial);
    },
    replaceCardProgress: (state) => {
      writeCardProgress(state);
      progressRef.current = state;
      setProgress(state);
    },
  }), [apply]);

  return (
    <CardProgressActionsContext.Provider value={actions}>
      <CardProgressStateContext.Provider value={progress}>{children}</CardProgressStateContext.Provider>
    </CardProgressActionsContext.Provider>
  );
}
