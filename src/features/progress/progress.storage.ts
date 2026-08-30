import { isDate, isRecord, mergeRecords, readStored, removeStored, writeStored } from "@/lib/storage";
import {
  createInitialProgress,
  type GrammarProgressRecord,
  type LessonProgressRecord,
  type ProgressState,
  type StoryProgressRecord,
} from "@/features/progress/progress.types";

export const PROGRESS_STORAGE_KEY = "calea:progress:v1";

const clamp = (value: unknown): number => {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? Math.min(1, Math.max(0, number)) : 0;
};

function parseLessons(value: unknown): Record<string, LessonProgressRecord> {
  if (!isRecord(value)) return {};
  const result: Record<string, LessonProgressRecord> = {};

  for (const [id, raw] of Object.entries(value)) {
    if (!isRecord(raw) || !isDate(raw.updatedAt)) continue;
    const status = raw.status === "completed" ? "completed" : raw.status === "in-progress" ? "in-progress" : null;
    if (!status) continue;
    result[id] = {
      status,
      resumePosition: clamp(raw.resumePosition),
      updatedAt: raw.updatedAt,
      ...(isDate(raw.completedAt) ? { completedAt: raw.completedAt } : {}),
    };
  }
  return result;
}

function parseStories(value: unknown): Record<string, StoryProgressRecord> {
  if (!isRecord(value)) return {};
  const result: Record<string, StoryProgressRecord> = {};

  for (const [id, raw] of Object.entries(value)) {
    if (!isRecord(raw) || !isDate(raw.updatedAt)) continue;
    result[id] = {
      resumePosition: clamp(raw.resumePosition),
      completed: raw.completed === true,
      updatedAt: raw.updatedAt,
      ...(isDate(raw.completedAt) ? { completedAt: raw.completedAt } : {}),
    };
  }
  return result;
}

function parseGrammar(value: unknown): Record<string, GrammarProgressRecord> {
  if (!isRecord(value)) return {};
  const result: Record<string, GrammarProgressRecord> = {};

  for (const [id, raw] of Object.entries(value)) {
    if (!isRecord(raw) || !isDate(raw.updatedAt)) continue;
    result[id] = {
      resumePosition: clamp(raw.resumePosition),
      updatedAt: raw.updatedAt,
    };
  }
  return result;
}

export function parseProgressState(value: unknown): ProgressState | null {
  if (!isRecord(value) || value.version !== 1) return null;
  return {
    version: 1,
    lessons: parseLessons(value.lessons),
    stories: parseStories(value.stories),
    grammar: parseGrammar(value.grammar),
  };
}

export function readProgress(): ProgressState {
  return readStored(PROGRESS_STORAGE_KEY, parseProgressState, createInitialProgress);
}

export function writeProgress(progress: ProgressState): void {
  writeStored(PROGRESS_STORAGE_KEY, progress);
}

export function clearProgress(): void {
  removeStored(PROGRESS_STORAGE_KEY);
}

/**
 * Reconciles our state with what another tab just wrote.
 *
 * The incoming state decides which entries *exist* — otherwise a reset in one
 * tab would be undone by the other resurrecting the entry it still remembers.
 * For an entry both tabs know, the newer `updatedAt` wins. Nothing is lost by
 * treating incoming as the base: silent scroll saves already hit storage
 * immediately, so anything this tab has recorded is part of that snapshot.
 */
export function mergeProgress(local: ProgressState, incoming: ProgressState): ProgressState {
  return {
    version: 1,
    lessons: mergeRecords(local.lessons, incoming.lessons),
    stories: mergeRecords(local.stories, incoming.stories),
    grammar: mergeRecords(local.grammar, incoming.grammar),
  };
}


