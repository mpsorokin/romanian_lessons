import { parse as parseYaml } from "yaml";

export interface ContentItem {
  id: string;
  title: string;
  subtitle?: string;
  level?: string;
  wordCount?: number;
  markdown: string;
}

export interface Lesson extends ContentItem {
  type: "lesson";
  order: number;
}

export interface Story extends ContentItem {
  type: "story";
  order: number;
}

export type Content = Lesson | Story;

type RawFrontmatter = {
  id?: unknown;
  order?: unknown;
  title?: unknown;
  subtitle?: unknown;
  level?: unknown;
  wordCount?: unknown;
};

const lessons = import.meta.glob<string>("../content/lessons/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

const stories = import.meta.glob<string>("../content/stories/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

function asRequiredString(value: unknown, field: string, source: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Invalid ${field} in ${source}: expected a non-empty string.`);
  }
  return value.trim();
}

function asOptionalString(value: unknown, field: string, source: string): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return asRequiredString(value, field, source);
}

function asRequiredNumber(value: unknown, field: string, source: string): number {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`Invalid ${field} in ${source}: expected a number.`);
  }
  return number;
}

function parseMarkdown(raw: string, source: string): { frontmatter: RawFrontmatter; markdown: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new Error(`Missing YAML frontmatter in ${source}.`);
  }

  const frontmatter = parseYaml(match[1]) as RawFrontmatter | null;
  if (!frontmatter || typeof frontmatter !== "object" || Array.isArray(frontmatter)) {
    throw new Error(`Invalid YAML frontmatter in ${source}.`);
  }

  return { frontmatter, markdown: match[2].trim() };
}

function loadContent(modules: Record<string, string>, type: "lesson" | "story"): Content[] {
  return Object.entries(modules).map(([source, raw]) => {
    const { frontmatter, markdown } = parseMarkdown(raw, source);
    const content = {
      id: asRequiredString(frontmatter.id, "id", source),
      order: asRequiredNumber(frontmatter.order, "order", source),
      title: asRequiredString(frontmatter.title, "title", source),
      subtitle: asOptionalString(frontmatter.subtitle, "subtitle", source),
      level: asOptionalString(frontmatter.level, "level", source),
      wordCount:
        frontmatter.wordCount === undefined
          ? undefined
          : asRequiredNumber(frontmatter.wordCount, "wordCount", source),
      markdown,
      type,
    } as Content;

    return content;
  });
}

function assertUniqueIds(items: Content[]): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) {
      throw new Error(`Duplicate content id: ${item.id}. IDs must be unique.`);
    }
    seen.add(item.id);
  }
}

export let contentLoadError: Error | null = null;
export let lessonContent: Lesson[] = [];
export let storyContent: Story[] = [];

try {
  lessonContent = loadContent(lessons, "lesson") as Lesson[];
  storyContent = loadContent(stories, "story") as Story[];
  assertUniqueIds([...lessonContent, ...storyContent]);
  lessonContent.sort((a, b) => a.order - b.order);
  storyContent.sort((a, b) => a.order - b.order);
} catch (error) {
  contentLoadError = error instanceof Error ? error : new Error(String(error));
}

export const allContent: Content[] = [...lessonContent, ...storyContent];

export function findContent(type: "lesson" | "story", id: string): Content | undefined {
  const items = type === "lesson" ? lessonContent : storyContent;
  return items.find((item) => item.id === id);
}

export function getCurrentLevel(): string {
  return allContent.find((item) => item.level)?.level ?? "A1";
}
