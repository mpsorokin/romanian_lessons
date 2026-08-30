import test from "node:test";
import assert from "node:assert/strict";
import {
  averageStoryLength,
  completedLessonCount,
  completedMaterialCount,
  completedStoryCount,
  estimatedWordsRead,
  getActiveStory,
  getLastTouched,
  getNextLesson,
  overallProgress,
} from "../../src/features/progress/metrics.ts";
import { clampFontSize, clampLineHeight, asReaderTheme } from "../../src/features/reader/readerSettings.types.ts";

const lessons = [1, 2, 3].map((order) => ({ id: `lesson-0${order}`, order, title: `L${order}`, file: "", type: "lesson" }));
const stories = [1, 2].map((order) => ({ id: `story-0${order}`, order, title: `S${order}`, file: "", type: "story", wordCount: order * 100 }));

const at = (day) => `2026-01-0${day}T00:00:00.000Z`;
const state = (lessonEntries = {}, storyEntries = {}) => ({ version: 1, lessons: lessonEntries, stories: storyEntries, grammar: {} });

test("counts only genuinely finished material", () => {
  const progress = state(
    {
      "lesson-01": { status: "completed", resumePosition: 1, updatedAt: at(1) },
      "lesson-02": { status: "in-progress", resumePosition: 0.5, updatedAt: at(2) },
    },
    { "story-01": { resumePosition: 1, completed: true, updatedAt: at(1) } },
  );

  assert.equal(completedLessonCount(progress), 1);
  assert.equal(completedStoryCount(progress), 1);
  assert.equal(completedMaterialCount(progress), 2);
  assert.equal(overallProgress(progress, [...lessons, ...stories]), 2 / 5);
});

test("overall progress of an empty catalogue is zero, not NaN", () => {
  assert.equal(overallProgress(state(), []), 0);
});

test("the next lesson is the most recently touched unfinished one", () => {
  const progress = state({
    "lesson-01": { status: "completed", resumePosition: 1, updatedAt: at(1) },
    "lesson-02": { status: "in-progress", resumePosition: 0.2, updatedAt: at(2) },
    "lesson-03": { status: "in-progress", resumePosition: 0.4, updatedAt: at(3) },
  });
  assert.equal(getNextLesson(lessons, progress).id, "lesson-03");
});

test("with nothing started the next lesson is simply the first", () => {
  assert.equal(getNextLesson(lessons, state()).id, "lesson-01");
});

test("all lessons finished leaves no next lesson", () => {
  const progress = state(Object.fromEntries(lessons.map((l) => [l.id, { status: "completed", resumePosition: 1, updatedAt: at(1) }])));
  assert.equal(getNextLesson(lessons, progress), undefined);
});

test("the active story must be started, unfinished, and the most recent", () => {
  const progress = state({}, {
    "story-01": { resumePosition: 0.3, completed: false, updatedAt: at(1) },
    "story-02": { resumePosition: 0.6, completed: false, updatedAt: at(2) },
  });
  assert.equal(getActiveStory(stories, progress).id, "story-02");

  const untouched = state({}, { "story-01": { resumePosition: 0, completed: false, updatedAt: at(1) } });
  assert.equal(getActiveStory(stories, untouched), undefined, "a story at position 0 is not in progress");

  const done = state({}, { "story-01": { resumePosition: 1, completed: true, updatedAt: at(1) } });
  assert.equal(getActiveStory(stories, done), undefined, "a finished story is not resumable");
});

test("estimated words counts a finished story in full and a partial one pro rata", () => {
  const progress = state({}, {
    "story-01": { resumePosition: 0.3, completed: true, updatedAt: at(1) },
    "story-02": { resumePosition: 0.5, completed: false, updatedAt: at(1) },
  });
  // story-01 is 100 words and completed, story-02 is 200 words at half way.
  assert.equal(estimatedWordsRead(stories, progress), 200);
});

test("average story length ignores stories without a word count", () => {
  assert.equal(averageStoryLength(stories), 150);
  assert.equal(averageStoryLength([...stories, { id: "x", order: 9, title: "X", file: "", type: "story" }]), 150);
  assert.equal(averageStoryLength([]), 0);
});

test("last touched picks the newest entry and ignores untouched items", () => {
  const progress = state({
    "lesson-01": { status: "in-progress", resumePosition: 0.1, updatedAt: at(3) },
    "lesson-02": { status: "in-progress", resumePosition: 0.1, updatedAt: at(1) },
  });
  assert.equal(getLastTouched(lessons, progress, "lesson").id, "lesson-01");
  assert.equal(getLastTouched(lessons, state(), "lesson"), undefined);
});

test("reader settings are clamped to the range the UI can actually render", () => {
  assert.equal(clampFontSize(4), 18);
  assert.equal(clampFontSize(99), 26);
  assert.equal(clampFontSize(20.6), 21, "font size is always a whole pixel");

  assert.equal(clampLineHeight(0.2), 1.4);
  assert.equal(clampLineHeight(9), 2);
  assert.equal(clampLineHeight(1.63), 1.65, "line height snaps to a 0.05 step");

  assert.equal(asReaderTheme("dark"), "dark");
  assert.equal(asReaderTheme("paper"), "paper");
  assert.equal(asReaderTheme("nonsense"), "paper");
});
