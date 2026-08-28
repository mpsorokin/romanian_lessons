import { useContext, useMemo } from "react";
import { ProgressActionsContext, ProgressStateContext, type ProgressActions } from "@/features/reading/ProgressProvider";
import type { LessonStatus, ProgressState } from "@/features/reading/progress.types";

/** Stable mutators; using this alone keeps a component out of every progress re-render. */
export function useProgressActions(): ProgressActions {
  const context = useContext(ProgressActionsContext);
  if (!context) throw new Error("useProgressActions must be used inside ProgressProvider.");
  return context;
}

/** Subscribes to progress changes. */
export function useProgressState(): ProgressState {
  const context = useContext(ProgressStateContext);
  if (!context) throw new Error("useProgressState must be used inside ProgressProvider.");
  return context;
}

export function useProgress() {
  const progress = useProgressState();
  const actions = useProgressActions();

  return useMemo(
    () => ({
      progress,
      getLessonStatus: (id: string): LessonStatus => progress.lessons[id]?.status ?? "new",
      getLessonPosition: (id: string) => progress.lessons[id]?.resumePosition ?? 0,
      getStoryProgress: (id: string) => {
        const entry = progress.stories[id];
        return {
          maxProgress: entry?.maxProgress ?? 0,
          resumePosition: entry?.resumePosition ?? 0,
          completed: entry?.completed ?? false,
        };
      },
      getGrammarProgress: (id: string) => progress.grammar[id]?.maxProgress ?? 0,
      ...actions,
    }),
    [progress, actions],
  );
}
