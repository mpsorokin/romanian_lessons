import { grammarIndex, lessonIndex, lessonReferenceIndex, storyIndex } from "virtual:content-index";
import type {
  Content,
  Grammar,
  Lesson,
  LessonReference,
  LessonReferenceWord,
  ReadableContent,
  Story,
} from "@/lib/content.types";
import lessonReferenceWordsData from "@/content/lesson-references/words.json";

/**
 * Metadata is parsed at build time by `scripts/vite-content-index.mjs`, so it is
 * already validated and sorted by `order` here.
 */
export const lessonContent: Lesson[] = lessonIndex;
export const lessonReferenceContent: LessonReference[] = lessonReferenceIndex;
export const storyContent: Story[] = storyIndex;
export const allContent: Content[] = [...lessonContent, ...storyContent];
export const grammarContent: Grammar[] = grammarIndex;

/**
 * `resolveJsonModule` widens `noun.gender` to `string`; the literal union is
 * enforced by `tests/lesson-references.test.mjs`, which is what makes this
 * narrowing safe.
 */
export const lessonReferenceWords = lessonReferenceWordsData as LessonReferenceWord[];

const lessonById = new Map(lessonContent.map((lesson) => [lesson.id, lesson]));
const lessonReferenceById = new Map(lessonReferenceContent.map((reference) => [reference.id, reference]));
const storyById = new Map(storyContent.map((story) => [story.id, story]));
const grammarById = new Map(grammarContent.map((topic) => [topic.id, topic]));

/** Built once, like every other index here: the words table is read per lesson. */
const lessonReferenceWordsByLesson = new Map<string, LessonReferenceWord[]>();
for (const word of lessonReferenceWords) {
  const words = lessonReferenceWordsByLesson.get(word.lessonId);
  if (words) words.push(word);
  else lessonReferenceWordsByLesson.set(word.lessonId, [word]);
}

export function getLessonReferenceWords(lessonId: string): LessonReferenceWord[] {
  return lessonReferenceWordsByLesson.get(lessonId) ?? [];
}

export function findContent(type: "lesson", id: string): Lesson | undefined;
export function findContent(type: "lesson-reference", id: string): LessonReference | undefined;
export function findContent(type: "story", id: string): Story | undefined;
export function findContent(type: "grammar", id: string): Grammar | undefined;
export function findContent(type: "lesson" | "lesson-reference" | "story" | "grammar", id: string): ReadableContent | undefined {
  if (type === "lesson") return lessonById.get(id);
  if (type === "lesson-reference") return lessonReferenceById.get(id);
  if (type === "story") return storyById.get(id);
  return grammarById.get(id);
}

export function getCurrentLevel(): string {
  return allContent.find((item) => item.level)?.level ?? "A1";
}
