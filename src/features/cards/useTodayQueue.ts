import { useMemo, useSyncExternalStore } from "react";
import type { CardProgressStateV2 } from "@/features/cards/cardProgress.types";
import { getNextReviewDate, getTodayQueue, type TodayQueue } from "@/features/cards/cards";
import { dateKey } from "@/features/cards/scheduler";

/**
 * One shared clock for every date-derived view. Each consumer used to own a
 * timer and a piece of state, so a rollover cost four listeners and four
 * separate renders; now the listeners exist only while something is mounted and
 * all consumers read the same snapshot in one pass.
 */
let currentDay = dateKey(new Date());
const daySubscribers = new Set<() => void>();

function refreshDay(): void {
  const next = dateKey(new Date());
  if (next === currentDay) return;
  currentDay = next;
  for (const notify of daySubscribers) notify();
}

let timer: number | undefined;

function subscribeToDay(onChange: () => void): () => void {
  daySubscribers.add(onChange);
  if (daySubscribers.size === 1) {
    document.addEventListener("visibilitychange", refreshDay);
    window.addEventListener("focus", refreshDay);
    timer = window.setInterval(refreshDay, 60_000);
    // Nothing was watching the clock, so the cached day may predate this mount.
    refreshDay();
  }
  return () => {
    daySubscribers.delete(onChange);
    if (daySubscribers.size > 0) return;
    document.removeEventListener("visibilitychange", refreshDay);
    window.removeEventListener("focus", refreshDay);
    if (timer !== undefined) window.clearInterval(timer);
    timer = undefined;
  };
}

const getDaySnapshot = () => currentDay;

/** Refreshes date based queue data when the local day changes or the app returns to the foreground. */
export function useTodayDateKey(): string {
  return useSyncExternalStore(subscribeToDay, getDaySnapshot, getDaySnapshot);
}

export function useTodayQueue(progress: CardProgressStateV2): TodayQueue {
  const today = useTodayDateKey();
  return useMemo(() => getTodayQueue(progress, new Date()), [progress, today]);
}

export function useNextReviewDate(progress: CardProgressStateV2): string | null {
  const today = useTodayDateKey();
  return useMemo(() => getNextReviewDate(progress, new Date()), [progress, today]);
}
