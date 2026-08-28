import { createContext, useCallback, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { clearProgress, readProgress, writeProgress } from "@/features/reading/progress.storage";
import { createInitialProgress, type ProgressState } from "@/features/reading/progress.types";

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

const positionMoved = (previous: number, next: number, force = false) =>
  force || Math.abs(next - previous) >= POSITION_EPSILON;

export function ProgressProvider({ children }: PropsWithChildren) {
  const [progress, setProgress] = useState<ProgressState>(() => readProgress());
  const progressRef = useRef(progress);

  /**
   * Persists synchronously instead of from an effect: the reader flushes its
   * scroll position on `pagehide`, where a passive effect would never run.
   */
  const commit = useCallback((update: (current: ProgressState) => ProgressState, broadcast = true) => {
    const next = update(progressRef.current);
    if (next === progressRef.current) return;
    progressRef.current = next;
    writeProgress(next);
    if (broadcast) setProgress(next);
  }, []);

  const syncProgressState = useCallback(() => {
    setProgress(progressRef.current);
  }, []);

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
        }, false),

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
          if (entry && !positionMoved(entry.resumePosition, nextPosition, options?.force) && entry.completed === isComplete) {
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
        }, false),

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
        }, false),

      resetProgress: () => {
        const initial = createInitialProgress();
        clearProgress();
        progressRef.current = initial;
        setProgress(initial);
      },

      replaceProgress: (state) => {
        writeProgress(state);
        progressRef.current = state;
        setProgress(state);
      },
    };
  }, [commit, syncProgressState]);

  return (
    <ProgressActionsContext.Provider value={actions}>
      <ProgressStateContext.Provider value={progress}>{children}</ProgressStateContext.Provider>
    </ProgressActionsContext.Provider>
  );
}
