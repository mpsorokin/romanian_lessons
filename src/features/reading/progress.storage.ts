import {
  createInitialProgress,
  type GrammarProgressRecord,
  type LessonProgressRecord,
  type ProgressState,
  type StoryProgressRecord,
} from "@/features/reading/progress.types";

export const PROGRESS_STORAGE_KEY = "calea:progress:v1";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const clamp = (value: unknown): number => {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? Math.min(1, Math.max(0, number)) : 0;
};

const isDate = (value: unknown): value is string => typeof value === "string" && value.length > 0;

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
      maxProgress: clamp(raw.maxProgress),
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
    const resumePosition = clamp(raw.resumePosition);
    result[id] = {
      resumePosition,
      maxProgress: clamp(raw.maxProgress ?? resumePosition),
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
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return createInitialProgress();
    const parsed: unknown = JSON.parse(raw);
    return parseProgressState(parsed) ?? createInitialProgress();
  } catch {
    return createInitialProgress();
  }
}

export function writeProgress(progress: ProgressState): void {
  try {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Private browsing or disabled storage should not prevent reading.
  }
}

export function clearProgress(): void {
  try {
    window.localStorage.removeItem(PROGRESS_STORAGE_KEY);
  } catch {
    // Private browsing or disabled storage should not prevent resetting memory state.
  }
}
