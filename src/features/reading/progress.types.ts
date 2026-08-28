export type LessonStatus = "new" | "in-progress" | "completed";

export interface LessonProgressRecord {
  status: Exclude<LessonStatus, "new">;
  resumePosition: number;
  updatedAt: string;
  completedAt?: string;
}

export interface StoryProgressRecord {
  maxProgress: number;
  resumePosition: number;
  completed: boolean;
  updatedAt: string;
  completedAt?: string;
}

export interface ProgressState {
  version: 1;
  lessons: Record<string, LessonProgressRecord>;
  stories: Record<string, StoryProgressRecord>;
}

export function createInitialProgress(): ProgressState {
  return { version: 1, lessons: {}, stories: {} };
}
