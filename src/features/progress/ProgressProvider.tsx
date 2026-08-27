import { createContext, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { clearProgress, readProgress, writeProgress } from "./progress.storage";
import { createInitialProgress, type LessonStatus, type ProgressState } from "./progress.types";

interface ProgressContextValue {
  progress: ProgressState;
  getLessonStatus: (id: string) => LessonStatus;
  getLessonPosition: (id: string) => number;
  getStoryProgress: (id: string) => { maxProgress: number; resumePosition: number; completed: boolean };
  openLesson: (id: string) => void;
  saveLessonPosition: (id: string, position: number) => void;
  completeLesson: (id: string) => void;
  saveStoryPosition: (id: string, currentProgress: number, resumePosition?: number) => void;
  completeStory: (id: string) => void;
  resetProgress: () => void;
}

export const ProgressContext = createContext<ProgressContextValue | null>(null);

const clamp = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
const now = () => new Date().toISOString();

export function ProgressProvider({ children }: PropsWithChildren) {
  const [progress, setProgress] = useState<ProgressState>(() => readProgress());

  useEffect(() => {
    writeProgress(progress);
  }, [progress]);

  const getLessonStatus = useCallback(
    (id: string): LessonStatus => progress.lessons[id]?.status ?? "new",
    [progress.lessons],
  );

  const getLessonPosition = useCallback(
    (id: string) => progress.lessons[id]?.resumePosition ?? 0,
    [progress.lessons],
  );

  const getStoryProgress = useCallback(
    (id: string) => {
      const entry = progress.stories[id];
      return {
        maxProgress: entry?.maxProgress ?? 0,
        resumePosition: entry?.resumePosition ?? 0,
        completed: entry?.completed ?? false,
      };
    },
    [progress.stories],
  );

  const openLesson = useCallback((id: string) => {
    setProgress((current) => {
      const existing = current.lessons[id];
      if (existing?.status === "completed") return current;
      return {
        ...current,
        lessons: {
          ...current.lessons,
          [id]: {
            status: "in-progress",
            resumePosition: existing?.resumePosition ?? 0,
            updatedAt: now(),
          },
        },
      };
    });
  }, []);

  const saveLessonPosition = useCallback((id: string, position: number) => {
    setProgress((current) => {
      const existing = current.lessons[id];
      if (existing?.status === "completed") return current;
      return {
        ...current,
        lessons: {
          ...current.lessons,
          [id]: {
            status: "in-progress",
            resumePosition: clamp(position),
            updatedAt: now(),
          },
        },
      };
    });
  }, []);

  const completeLesson = useCallback((id: string) => {
    setProgress((current) => ({
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
    }));
  }, []);

  const saveStoryPosition = useCallback((id: string, currentProgress: number, resumePosition = currentProgress) => {
    setProgress((current) => {
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
    });
  }, []);

  const completeStory = useCallback((id: string) => {
    setProgress((current) => ({
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
    }));
  }, []);

  const reset = useCallback(() => {
    clearProgress();
    setProgress(createInitialProgress());
  }, []);

  const value = useMemo(
    () => ({
      progress,
      getLessonStatus,
      getLessonPosition,
      getStoryProgress,
      openLesson,
      saveLessonPosition,
      completeLesson,
      saveStoryPosition,
      completeStory,
      resetProgress: reset,
    }),
    [
      progress,
      getLessonStatus,
      getLessonPosition,
      getStoryProgress,
      openLesson,
      saveLessonPosition,
      completeLesson,
      saveStoryPosition,
      completeStory,
      reset,
    ],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}
