import type { Content, Lesson, Story } from "@/lib/content";
import type { ProgressState } from "@/features/progress/progress.types";

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
      return entry && !entry.completed && entry.resumePosition > 0;
    })
    .sort((a, b) => (progress.stories[b.id]?.updatedAt ?? "").localeCompare(progress.stories[a.id]?.updatedAt ?? ""))[0];
}

export function averageStoryLength(stories: Story[]) {
  const lengths = stories.map((story) => story.wordCount).filter((value): value is number => typeof value === "number");
  return lengths.length ? Math.round(lengths.reduce((sum, value) => sum + value, 0) / lengths.length) : 0;
}

export function estimatedWordsRead(stories: Story[], progress: ProgressState) {
  return Math.round(
    stories.reduce((sum, story) => {
      const entry = progress.stories[story.id];
      const fraction = entry?.completed ? 1 : (entry?.resumePosition ?? 0);
      return sum + (story.wordCount ?? 0) * fraction;
    }, 0),
  );
}

export function getLastTouched<T extends { id: string }>(items: T[], progress: ProgressState, type: "lesson" | "story") {
  const entries = type === "lesson" ? progress.lessons : progress.stories;
  return items
    .filter((item) => entries[item.id])
    .sort((a, b) => (entries[b.id]?.updatedAt ?? "").localeCompare(entries[a.id]?.updatedAt ?? ""))[0];
}
