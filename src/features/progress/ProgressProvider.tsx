import { createContext, useCallback, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { clearProgress, readProgress, writeProgress } from "./progress.storage";
import { createInitialProgress, type ProgressState } from "./progress.types";

export interface ProgressActions {
  /** Reads the current state without subscribing to it. */
  getProgressSnapshot: () => ProgressState;
  openLesson: (id: string) => void;
  saveLessonPosition: (id: string, position: number) => void;
  completeLesson: (id: string) => void;
  saveStoryPosition: (id: string, currentProgress: number, resumePosition?: number) => void;
  completeStory: (id: string) => void;
  resetProgress: () => void;
}

export const ProgressStateContext = createContext<ProgressState | null>(null);
export const ProgressActionsContext = createContext<ProgressActions | null>(null);

const clamp = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
const now = () => new Date().toISOString();

export function ProgressProvider({ children }: PropsWithChildren) {
  const [progress, setProgress] = useState<ProgressState>(() => readProgress());
  const progressRef = useRef(progress);

  /**
   * Persists synchronously instead of from an effect: the reader flushes its
   * scroll position on `pagehide`, where a passive effect would never run.
   */
  const apply = useCallback((update: (current: ProgressState) => ProgressState) => {
    const next = update(progressRef.current);
    if (next === progressRef.current) return;
    progressRef.current = next;
    writeProgress(next);
    setProgress(next);
  }, []);

  const actions = useMemo<ProgressActions>(() => {
    return {
      getProgressSnapshot: () => progressRef.current,

      openLesson: (id) =>
        apply((current) => {
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

      saveLessonPosition: (id, position) =>
        apply((current) => {
          const existing = current.lessons[id];
          if (existing?.status === "completed") return current;
          return {
            ...current,
            lessons: {
              ...current.lessons,
              [id]: { status: "in-progress", resumePosition: clamp(position), updatedAt: now() },
            },
          };
        }),

      completeLesson: (id) =>
        apply((current) => ({
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

      saveStoryPosition: (id, currentProgress, resumePosition = currentProgress) =>
        apply((current) => {
          const existing = current.stories[id];
          const nextCurrent = clamp(resumePosition);
          const nextProgress = clamp(currentProgress);
          const shouldComplete = existing?.completed === true || nextProgress >= 0.96;
          return {
            ...current,
            stories: {
              ...current.stories,
              [id]: {
                maxProgress: shouldComplete ? 1 : nextProgress,
                resumePosition: nextCurrent,
                completed: shouldComplete,
                updatedAt: now(),
                ...(shouldComplete ? { completedAt: existing?.completedAt ?? now() } : {}),
              },
            },
          };
        }),

      completeStory: (id) =>
        apply((current) => ({
          ...current,
          stories: {
            ...current.stories,
            [id]: {
              maxProgress: 1,
              resumePosition: 1,
              completed: true,
              updatedAt: now(),
              completedAt: current.stories[id]?.completedAt ?? now(),
            },
          },
        })),

      resetProgress: () => {
        const initial = createInitialProgress();
        clearProgress();
        progressRef.current = initial;
        setProgress(initial);
      },
    };
  }, [apply]);

  return (
    <ProgressActionsContext.Provider value={actions}>
      <ProgressStateContext.Provider value={progress}>{children}</ProgressStateContext.Provider>
    </ProgressActionsContext.Provider>
  );
}
