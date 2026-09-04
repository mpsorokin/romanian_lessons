import { createContext, useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { subscribeToStorage } from "@/lib/storage";
import { CARD_PROGRESS_V2_STORAGE_KEY, createResetCardProgressV2, mergeCardProgressV2, parseCardProgressStateV2, readCardProgressV2, writeCardProgressV2 } from "@/features/cards/cardProgress.v2.storage";
import { applyReview, dateKey, initialDailyUsage, makeReviewLogId, normalizeDailyUsage, pruneReviewLog, type ReviewTransition } from "@/features/cards/scheduler";
import type { CardProgressStateV2, CardResult, CardStatus, TodaySessionState } from "@/features/cards/cardProgress.types";

export interface MarkCardOptions {
  mode?: "today" | "manual";
  retry?: boolean;
  /** Guards against a double submit replaying the same answer. */
  attemptKey?: string;
  /** Present means "also store this session"; `null` ends the day's primary run. */
  session?: TodaySessionState | null;
}

export interface CardProgressActions {
  getCardStatus: (id: string) => CardStatus | "new";
  markCard: (id: string, result: CardResult, options?: MarkCardOptions) => void;
  saveTodaySession: (session: TodaySessionState | null) => void;
  resetCardProgress: () => void;
  replaceCardProgress: (state: CardProgressStateV2) => void;
}

export const CardProgressStateContext = createContext<CardProgressStateV2 | null>(null);
export const CardProgressActionsContext = createContext<CardProgressActions | null>(null);

const now = () => new Date();

/** Newest attempt keys kept for the double-submit guard. */
const ATTEMPT_KEY_MEMORY = 200;

const hasSession = (options: MarkCardOptions | undefined): boolean =>
  options !== undefined && Object.prototype.hasOwnProperty.call(options, "session");

export function CardProgressProvider({ children }: PropsWithChildren) {
  const [progress, setProgress] = useState<CardProgressStateV2>(() => readCardProgressV2());
  const progressRef = useRef(progress);
  const appliedAttemptKeys = useRef(new Set<string>());

  const commit = useCallback((next: CardProgressStateV2) => {
    progressRef.current = next;
    writeCardProgressV2(next);
    setProgress(next);
  }, []);

  const apply = useCallback(
    (update: (current: CardProgressStateV2) => CardProgressStateV2) => {
      const next = update(progressRef.current);
      if (next === progressRef.current) return;
      commit(next);
    },
    [commit],
  );

  useEffect(
    () => subscribeToStorage(CARD_PROGRESS_V2_STORAGE_KEY, (raw) => {
      if (raw === null) {
        commit(createResetCardProgressV2());
        return;
      }
      try {
        const incoming = parseCardProgressStateV2(JSON.parse(raw) as unknown);
        if (!incoming) return;
        const merged = mergeCardProgressV2(progressRef.current, incoming);
        progressRef.current = merged;
        setProgress(merged);
      } catch {
        // Keep the current session when another tab writes an unreadable blob.
      }
    }),
    [commit],
  );

  const markCard = useCallback((id: string, result: CardResult, options?: MarkCardOptions) => {
    if (options?.attemptKey) {
      const seen = appliedAttemptKeys.current;
      if (seen.has(options.attemptKey)) return;
      seen.add(options.attemptKey);
      if (seen.size > ATTEMPT_KEY_MEMORY) {
        const oldest = seen.values().next().value;
        if (oldest) seen.delete(oldest);
      }
    }
    const sessionProvided = hasSession(options);
    apply((current) => {
      const timestamp = now();
      const transition: ReviewTransition = applyReview(current.cards[id], result, timestamp, options?.mode ?? "manual", options?.retry ?? false);
      const isNew = transition.attempt === "new";

      const log = { ...transition.log, id: makeReviewLogId(id, transition.log.answeredAt), cardId: id };
      const needToReview = transition.removeFromReviewQueue
        ? current.needToReview.filter((cardId) => cardId !== id)
        : result === "repeat" && !current.needToReview.includes(id)
          ? [...current.needToReview, id]
          : current.needToReview;

      const deckId = id.split(":")[0];
      const startedDeckIds = isNew && !current.startedDeckIds.includes(deckId)
        ? [...current.startedDeckIds, deckId]
        : current.startedDeckIds;

      const daily = normalizeDailyUsage(current.daily, dateKey(timestamp));
      return {
        ...current,
        cards: { ...current.cards, [id]: transition.record },
        needToReview,
        startedDeckIds,
        daily: {
          ...daily,
          newIntroduced: isNew ? daily.newIntroduced + 1 : daily.newIntroduced,
          primaryCompleted: sessionProvided && options?.session === null ? true : daily.primaryCompleted,
        },
        reviewLog: pruneReviewLog([...current.reviewLog, log], timestamp),
        activeSession: sessionProvided ? options?.session ?? null : current.activeSession,
      };
    });
  }, [apply]);

  const actions = useMemo<CardProgressActions>(() => ({
    getCardStatus: (id) => progressRef.current.cards[id]?.status ?? "new",
    markCard,
    saveTodaySession: (session) => apply((current) => {
      const daily = normalizeDailyUsage(current.daily, dateKey(now()));
      return {
        ...current,
        activeSession: session,
        daily: session ? daily : { ...daily, primaryCompleted: true },
      };
    }),
    resetCardProgress: () => commit(createResetCardProgressV2()),
    replaceCardProgress: (state) => commit({
      ...state,
      version: 2,
      daily: state.daily ?? initialDailyUsage(),
      resetAt: state.resetAt ?? new Date().toISOString(),
    }),
  }), [apply, commit, markCard]);

  return (
    <CardProgressActionsContext.Provider value={actions}>
      <CardProgressStateContext.Provider value={progress}>{children}</CardProgressStateContext.Provider>
    </CardProgressActionsContext.Provider>
  );
}
