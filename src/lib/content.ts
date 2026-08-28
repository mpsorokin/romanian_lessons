import { grammarIndex, lessonIndex, storyIndex } from "virtual:content-index";
import type { Content, Grammar, Lesson, ReadableContent, Story } from "@/lib/content.types";

export type { Content, ContentMeta, Grammar, Lesson, ReadableContent, Story } from "./content.types";

/**
 * Metadata is parsed at build time by `scripts/vite-content-index.mjs`, so it is
 * already validated and sorted by `order` here.
 */
export const lessonContent: Lesson[] = lessonIndex;
export const storyContent: Story[] = storyIndex;
export const allContent: Content[] = [...lessonContent, ...storyContent];
export const grammarContent: Grammar[] = grammarIndex;

const lessonById = new Map(lessonContent.map((lesson) => [lesson.id, lesson]));
const storyById = new Map(storyContent.map((story) => [story.id, story]));
const grammarById = new Map(grammarContent.map((topic) => [topic.id, topic]));

export function findContent(type: "lesson", id: string): Lesson | undefined;
export function findContent(type: "story", id: string): Story | undefined;
export function findContent(type: "grammar", id: string): Grammar | undefined;
export function findContent(type: "lesson" | "story" | "grammar", id: string): ReadableContent | undefined {
  if (type === "lesson") return lessonById.get(id);
  if (type === "story") return storyById.get(id);
  return grammarById.get(id);
}

export function getCurrentLevel(): string {
  return allContent.find((item) => item.level)?.level ?? "A1";
}

export function getLessonLengthLabel(lesson: Lesson): string {
  return lesson.wordCount ? `${lesson.wordCount} слов` : "Повторение";
}

const bodyLoaders: Record<ReadableContent["type"], Record<string, () => Promise<string>>> = {
  lesson: import.meta.glob<string>("../content/lessons/*.md", { query: "?raw", import: "default" }),
  story: import.meta.glob<string>("../content/stories/*.md", { query: "?raw", import: "default" }),
  grammar: import.meta.glob<string>("../content/grammar/*.md", { query: "?raw", import: "default" }),
};

const FRONTMATTER = /^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/;
const bodyCache = new Map<string, string>();

/** Loads the markdown body of a single item; the frontmatter block is stripped here. */
export async function loadContentBody(item: ReadableContent): Promise<string> {
  const cacheKey = `${item.type}:${item.id}`;
  const cached = bodyCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const directory = item.type === "lesson" ? "lessons" : item.type === "story" ? "stories" : "grammar";
  const loader = bodyLoaders[item.type][`../content/${directory}/${item.file}`];
  if (!loader) throw new Error(`Missing content file for ${item.type} "${item.id}".`);

  const raw = await loader();
  const match = raw.match(FRONTMATTER);
  const body = (match ? match[1] : raw).trim();
  bodyCache.set(cacheKey, body);
  return body;
}
