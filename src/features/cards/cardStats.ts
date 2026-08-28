import { generatedCardCount } from "@/generated/cards.generated";
import type { CardProgressState } from "@/features/cards/cardProgress.types";

export interface CardDeckProgress {
  total: number;
  known: number;
  learning: number;
  newCount: number;
  percent: number;
}

/** Aggregate card progress without importing the full card dataset. */
export function getTotalCardProgress(progress: CardProgressState): CardDeckProgress {
  const total = generatedCardCount;
  let known = 0;
  let learning = 0;
  for (const record of Object.values(progress.cards)) {
    if (record.status === "known") known += 1;
    else if (record.status === "learning") learning += 1;
  }
  known = Math.min(known, total);
  learning = Math.min(learning, Math.max(0, total - known));
  return {
    total,
    known,
    learning,
    newCount: Math.max(0, total - known - learning),
    percent: total ? known / total : 0,
  };
}
