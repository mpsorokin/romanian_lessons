import { createContext, useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import {
  PROGRESS_STORAGE_KEY,
  clearProgress,
  mergeProgress,
  parseProgressState,
  readProgress,
  writeProgress,
} from "@/features/progress/progress.storage";
import { createInitialProgress, type ProgressState } from "@/features/progress/progress.types";
import { subscribeToStorage } from "@/lib/storage";

export interface ProgressSaveOptions {
  /** Bypass the 1% position quantizer — used on `pagehide` and reader unmount. */
  force?: boolean;
}

export interface ProgressActions {
  /** Reads the current state without subscribing to it. */
  getProgressSnapshot: () => ProgressState;
  /** Pushes the in-memory ref into React state after silent scroll saves. */
  syncProgressState: () => void;
  openLesson: (id: string) => void;
  saveLessonPosition: (id: string, position: number, options?: ProgressSaveOptions) => void;
  completeLesson: (id: string) => void;
  resetLesson: (id: string) => void;
  saveStoryPosition: (id: string, position: number, options?: ProgressSaveOptions) => void;
  completeStory: (id: string) => void;
  resetStory: (id: string) => void;
  saveGrammarPosition: (id: string, position: number, options?: ProgressSaveOptions) => void;
  resetProgress: () => void;
  replaceProgress: (state: ProgressState) => void;
}

export const ProgressStateContext = createContext<ProgressState | null>(null);
export const ProgressActionsContext = createContext<ProgressActions | null>(null);

const clamp = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
const now = () => new Date().toISOString();
const POSITION_EPSILON = 0.01;
/** Long enough to coalesce a burst of scroll saves, short enough to survive a crash. */
const WRITE_DEBOUNCE_MS = 1500;

const positionMoved = (previous: number, next: number, force = false) =>
  force || Math.abs(next - previous) >= POSITION_EPSILON;

export function ProgressProvider({ children }: PropsWithChildren) {
  const [progress, setProgress] = useState<ProgressState>(() => readProgress());
  const progressRef = useRef(progress);

  const pendingWrite = useRef<number | undefined>(undefined);

  const cancelPendingWrite = useCallback(() => {
    if (pendingWrite.current === undefined) return;
    window.clearTimeout(pendingWrite.current);
    pendingWrite.current = undefined;
  }, []);

  /** Cancels any deferred write and persists whatever the ref currently holds. */
  const flushWrite = useCallback(() => {
    cancelPendingWrite();
    writeProgress(progressRef.current);
  }, [cancelPendingWrite]);

  /**
   * Persists synchronously instead of from an effect: the reader flushes its
   * scroll position on `pagehide`, where a passive effect would never run.
   *
   * `defer` is the exception. A silent scroll save fires every time the reader
   * crosses another 1% of a text — around a hundred times per story — and each
   * one would otherwise serialise the whole state on the main thread. Deferred
   * writes coalesce; forced saves (unmount, `pagehide`) always go out at once,
   * and `progressRef` is the source of truth either way.
   */
  const commit = useCallback(
    (update: (current: ProgressState) => ProgressState, { broadcast = true, defer = false } = {}) => {
      const next = update(progressRef.current);
      if (next === progressRef.current) return;
      progressRef.current = next;

      if (defer) {
        if (pendingWrite.current === undefined) {
          pendingWrite.current = window.setTimeout(flushWrite, WRITE_DEBOUNCE_MS);
        }
      } else {
        flushWrite();
      }

      if (broadcast) setProgress(next);
    },
    [flushWrite],
  );

  /** Last line of defence for a deferred write if the tab goes away mid-read. */
  useEffect(() => {
    const onPageHide = () => flushWrite();
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      flushWrite();
    };
  }, [flushWrite]);

  const syncProgressState = useCallback(() => {
    setProgress(progressRef.current);
  }, []);

  /**
   * A second tab writing the same key would otherwise be invisible here, and the
   * next save from this tab would overwrite its progress wholesale. Adopting the
   * merge without writing it back keeps the two tabs converging instead of
   * ping-ponging writes at each other.
   */
  useEffect(
    () =>
      subscribeToStorage(PROGRESS_STORAGE_KEY, (raw) => {
        let incoming = createInitialProgress();
        if (raw !== null) {
          try {
            incoming = parseProgressState(JSON.parse(raw) as unknown) ?? incoming;
          } catch {
            return; // Unreadable write from elsewhere: keep what we have.
          }
        }
        const merged = mergeProgress(progressRef.current, incoming);
        progressRef.current = merged;
        setProgress(merged);
      }),
    [],
  );

  const actions = useMemo<ProgressActions>(() => {
    return {
      getProgressSnapshot: () => progressRef.current,
      syncProgressState,

      openLesson: (id) =>
        commit((current) => {
          const existing = current.lessons[id];
          if (existing?.status === "completed") return current;
          return {
            ...current,
            lessons: {
              ...current.lessons,
              [id]: { status: "in-progress", resumePosition: existing?.resumePosition ?? 0, updatedAt: now() },
            },
          };
        }),

      saveLessonPosition: (id, position, options) =>
        commit((current) => {
          const existing = current.lessons[id];
          const nextPosition = clamp(position);
          if (existing?.status === "completed") {
            if (!positionMoved(existing.resumePosition, nextPosition, options?.force)) return current;
            return {
              ...current,
              lessons: {
                ...current.lessons,
                [id]: { ...existing, resumePosition: nextPosition, updatedAt: now() },
              },
            };
          }
          if (
            existing?.status === "in-progress" &&
            !positionMoved(existing.resumePosition, nextPosition, options?.force)
          ) {
            return current;
          }
          return {
            ...current,
            lessons: {
              ...current.lessons,
              [id]: { status: "in-progress", resumePosition: nextPosition, updatedAt: now() },
            },
          };
        }, { broadcast: false, defer: !options?.force }),

      completeLesson: (id) =>
        commit((current) => ({
          ...current,
          lessons: {
            ...current.lessons,
            [id]: {
              status: "completed",
              resumePosition: current.lessons[id]?.resumePosition ?? 0,
              updatedAt: now(),
              completedAt: now(),
            },
          },
        })),

      resetLesson: (id) =>
        commit((current) => {
          if (!current.lessons[id]) return current;
          const { [id]: _removed, ...lessons } = current.lessons;
          return { ...current, lessons };
        }),

      saveStoryPosition: (id, position, options) =>
        commit((current) => {
          const entry = current.stories[id];
          const nextPosition = clamp(position);
          const isComplete = entry?.completed === true;
          if (entry && !positionMoved(entry.resumePosition, nextPosition, options?.force)) {
            return current;
          }
          return {
            ...current,
            stories: {
              ...current.stories,
              [id]: {
                resumePosition: nextPosition,
                completed: isComplete,
                updatedAt: now(),
                ...(isComplete && entry?.completedAt ? { completedAt: entry.completedAt } : {}),
              },
            },
          };
        }, { broadcast: false, defer: !options?.force }),

      completeStory: (id) =>
        commit((current) => ({
          ...current,
          stories: {
            ...current.stories,
            [id]: {
              resumePosition: current.stories[id]?.resumePosition ?? 0,
              completed: true,
              updatedAt: now(),
              completedAt: current.stories[id]?.completedAt ?? now(),
            },
          },
        })),

      resetStory: (id) =>
        commit((current) => {
          if (!current.stories[id]) return current;
          const { [id]: _removed, ...stories } = current.stories;
          return { ...current, stories };
        }),

      saveGrammarPosition: (id, position, options) =>
        commit((current) => {
          const existing = current.grammar[id];
          const nextPosition = clamp(position);
          if (existing && !positionMoved(existing.resumePosition, nextPosition, options?.force)) {
            return current;
          }
          return {
            ...current,
            grammar: {
              ...current.grammar,
              [id]: { resumePosition: nextPosition, updatedAt: now() },
            },
          };
        }, { broadcast: false, defer: !options?.force }),

      resetProgress: () => {
        const initial = createInitialProgress();
        cancelPendingWrite();
        clearProgress();
        progressRef.current = initial;
        setProgress(initial);
      },

      replaceProgress: (state) => {
        cancelPendingWrite();
        writeProgress(state);
        progressRef.current = state;
        setProgress(state);
      },
    };
  }, [cancelPendingWrite, commit, syncProgressState]);

  return (
    <ProgressActionsContext.Provider value={actions}>
      <ProgressStateContext.Provider value={progress}>{children}</ProgressStateContext.Provider>
    </ProgressActionsContext.Provider>
  );
}
