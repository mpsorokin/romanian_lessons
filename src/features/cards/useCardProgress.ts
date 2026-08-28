import { useContext, useMemo } from "react";
import { CardProgressActionsContext, CardProgressStateContext, type CardProgressActions } from "@/features/cards/CardProgressProvider";
import type { CardProgressState } from "@/features/cards/cardProgress.types";

export function useCardProgressState(): CardProgressState {
  const context = useContext(CardProgressStateContext);
  if (!context) throw new Error("useCardProgressState must be used inside CardProgressProvider.");
  return context;
}

export function useCardProgressActions(): CardProgressActions {
  const context = useContext(CardProgressActionsContext);
  if (!context) throw new Error("useCardProgressActions must be used inside CardProgressProvider.");
  return context;
}

export function useCardProgress() {
  const progress = useCardProgressState();
  const actions = useCardProgressActions();
  return useMemo(() => ({ progress, ...actions }), [progress, actions]);
}
