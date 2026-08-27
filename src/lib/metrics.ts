import type { Content, Lesson, Story } from "./content";
import type { ProgressState } from "../features/progress/progress.types";

export function completedLessonCount(progress: ProgressState) {
  return Object.values(progress.lessons).filter((entry) => entry.status === "completed").length;
}

export function completedStoryCount(progress: ProgressState) {
  return Object.values(progress.stories).filter((entry) => entry.completed).length;
}

export function completedMaterialCount(progress: ProgressState) {
  return completedLessonCount(progress) + completedStoryCount(progress);
}

export function overallProgress(progress: ProgressState, content: Content[]) {
  return content.length ? completedMaterialCount(progress) / content.length : 0;
}

export function getNextLesson(lessons: Lesson[], progress: ProgressState): Lesson | undefined {
  const unfinished = lessons.filter((lesson) => progress.lessons[lesson.id]?.status !== "completed");
  const active = unfinished
    .filter((lesson) => progress.lessons[lesson.id]?.status === "in-progress")
    .sort((a, b) => (progress.lessons[b.id]?.updatedAt ?? "").localeCompare(progress.lessons[a.id]?.updatedAt ?? ""));
  return active[0] ?? unfinished[0];
}

export function getActiveStory(stories: Story[], progress: ProgressState): Story | undefined {
  return stories
    .filter((story) => {
      const entry = progress.stories[story.id];
      return entry && !entry.completed && entry.maxProgress > 0;
    })
    .sort((a, b) => (progress.stories[b.id]?.updatedAt ?? "").localeCompare(progress.stories[a.id]?.updatedAt ?? ""))[0];
}

export function getRecentLessons(lessons: Lesson[], progress: ProgressState, limit = 3): Lesson[] {
  const touched = lessons
    .filter((lesson) => progress.lessons[lesson.id])
    .sort((a, b) => (progress.lessons[b.id]?.updatedAt ?? "").localeCompare(progress.lessons[a.id]?.updatedAt ?? ""));
  const touchedIds = new Set(touched.map((lesson) => lesson.id));
  return [...touched, ...lessons.filter((lesson) => !touchedIds.has(lesson.id))].slice(0, limit);
}

export function averageStoryLength(stories: Story[]) {
  const lengths = stories.map((story) => story.wordCount).filter((value): value is number => typeof value === "number");
  return lengths.length ? Math.round(lengths.reduce((sum, value) => sum + value, 0) / lengths.length) : 0;
}

export function estimatedWordsRead(stories: Story[], progress: ProgressState) {
  return Math.round(
    stories.reduce((sum, story) => sum + (story.wordCount ?? 0) * (progress.stories[story.id]?.maxProgress ?? 0), 0),
  );
}

export function getLastTouched<T extends { id: string }>(items: T[], progress: ProgressState, type: "lesson" | "story") {
  const entries = type === "lesson" ? progress.lessons : progress.stories;
  return items
    .filter((item) => entries[item.id])
    .sort((a, b) => (entries[b.id]?.updatedAt ?? "").localeCompare(entries[a.id]?.updatedAt ?? ""))[0];
}
