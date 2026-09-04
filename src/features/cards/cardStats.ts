import { generatedCardCount } from "@/generated/cards.count";
import type { CardDeckProgress, CardProgressState, CardProgressStateV2 } from "@/features/cards/cardProgress.types";

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

/** Below this many qualifying checks the rate is withheld as not meaningful. */
const RECALL_SAMPLE_MINIMUM = 10;

export interface RecallMetric {
  success: number;
  total: number;
  percent: number | null;
  remainingForRate: number;
}

/** Recall after a real pause, excluding new, early and retry attempts. */
export function getRecallMetric(progress: CardProgressStateV2, minimumPauseHours: number, now = new Date(), windowDays = 30): RecallMetric {
  const cutoff = now.getTime() - windowDays * 24 * 3_600_000;
  let total = 0;
  let success = 0;
  for (const entry of progress.reviewLog) {
    if (!entry.qualifiesForRecall || entry.pauseHours < minimumPauseHours) continue;
    if (Date.parse(entry.answeredAt) < cutoff) continue;
    total += 1;
    if (entry.result === "remembered") success += 1;
  }
  return {
    success,
    total,
    percent: total >= RECALL_SAMPLE_MINIMUM ? Math.round((success / total) * 100) : null,
    remainingForRate: Math.max(0, RECALL_SAMPLE_MINIMUM - total),
  };
}
