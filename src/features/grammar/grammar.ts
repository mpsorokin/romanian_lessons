import type { Grammar } from "@/lib/content.types";

export interface GrammarCategory {
  id: string;
  order: number;
}

/** The catalogue controls presentation order; topics themselves stay Markdown-driven. */
export const grammarCategories: GrammarCategory[] = [
  { id: "nouns-adjectives", order: 1 },
  { id: "pronouns", order: 2 },
  { id: "verbs", order: 3 },
  { id: "tenses-moods", order: 4 },
  { id: "sentence-structure", order: 5 },
  { id: "useful-language", order: 6 },
];

const categoriesById = new Map(grammarCategories.map((category) => [category.id, category]));

export function getGrammarCategory(categoryId: string): GrammarCategory {
  return categoriesById.get(categoryId) ?? { id: categoryId, order: Number.MAX_SAFE_INTEGER };
}

export interface GrammarGroup {
  category: GrammarCategory;
  topics: Grammar[];
}

export function groupGrammarTopics(topics: Grammar[]): GrammarGroup[] {
  const grouped = new Map<string, Grammar[]>();
  for (const topic of topics) {
    const current = grouped.get(topic.category) ?? [];
    current.push(topic);
    grouped.set(topic.category, current);
  }

  return Array.from(grouped.entries())
    .map(([categoryId, categoryTopics]) => ({
      category: getGrammarCategory(categoryId),
      topics: categoryTopics.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, "ro")),
    }))
    .sort((a, b) => a.category.order - b.category.order || a.category.id.localeCompare(b.category.id));
}

/** Search is case- and diacritic-insensitive while preserving the source copy. */
function normalizeGrammarSearch(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("ru-RU");
}

/**
 * Normalising is the expensive part (NFD + regex + locale casing), so each
 * topic's searchable text is folded once and kept. Without this every keystroke
 * re-normalised the whole catalogue, twice per topic.
 */
const haystackByTopic = new Map<string, string>();

function haystackFor(topic: Grammar): string {
  const cached = haystackByTopic.get(topic.id);
  if (cached !== undefined) return cached;
  const haystack = normalizeGrammarSearch(
    [topic.title, topic.subtitle, ...(topic.tags ?? [])].filter(Boolean).join(" "),
  );
  haystackByTopic.set(topic.id, haystack);
  return haystack;
}

/** Returns the input array untouched for an empty query, so callers keep their memo. */
export function filterGrammarTopics(topics: Grammar[], query: string): Grammar[] {
  const normalizedQuery = normalizeGrammarSearch(query.trim());
  if (!normalizedQuery) return topics;
  return topics.filter((topic) => haystackFor(topic).includes(normalizedQuery));
}
