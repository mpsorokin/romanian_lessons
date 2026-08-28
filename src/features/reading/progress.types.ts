export type LessonStatus = "new" | "in-progress" | "completed";

export interface LessonProgressRecord {
  status: Exclude<LessonStatus, "new">;
  resumePosition: number;
  updatedAt: string;
  completedAt?: string;
}

export interface StoryProgressRecord {
  resumePosition: number;
  completed: boolean;
  updatedAt: string;
  completedAt?: string;
}

export interface GrammarProgressRecord {
  resumePosition: number;
  updatedAt: string;
}

export interface ProgressState {
  version: 1;
  lessons: Record<string, LessonProgressRecord>;
  stories: Record<string, StoryProgressRecord>;
  grammar: Record<string, GrammarProgressRecord>;
}

export function createInitialProgress(): ProgressState {
  return { version: 1, lessons: {}, stories: {}, grammar: {} };
}
