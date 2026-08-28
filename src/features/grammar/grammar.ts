import type { Grammar } from "@/lib/content.types";

export interface GrammarCategory {
  id: string;
  label: string;
  order: number;
}

/** The catalogue controls presentation order; topics themselves stay Markdown-driven. */
export const grammarCategories: GrammarCategory[] = [
  { id: "nouns-adjectives", label: "Существительные и прилагательные", order: 1 },
  { id: "pronouns", label: "Местоимения", order: 2 },
  { id: "verbs", label: "Глаголы", order: 3 },
  { id: "tenses-moods", label: "Времена и наклонения", order: 4 },
  { id: "sentence-structure", label: "Структура предложения", order: 5 },
  { id: "useful-language", label: "Полезные конструкции", order: 6 },
];

const categoriesById = new Map(grammarCategories.map((category) => [category.id, category]));

export function getGrammarCategory(categoryId: string): GrammarCategory {
  return categoriesById.get(categoryId) ?? { id: categoryId, label: categoryId, order: Number.MAX_SAFE_INTEGER };
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
    .sort((a, b) => a.category.order - b.category.order || a.category.label.localeCompare(b.category.label, "ru"));
}

/** Search is case- and diacritic-insensitive while preserving the source copy. */
export function normalizeGrammarSearch(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("ru-RU");
}

export function grammarMatches(topic: Grammar, query: string): boolean {
  const normalizedQuery = normalizeGrammarSearch(query.trim());
  if (!normalizedQuery) return true;
  const haystack = [topic.title, topic.subtitle, ...(topic.tags ?? [])].filter(Boolean).join(" ");
  return normalizeGrammarSearch(haystack).includes(normalizedQuery);
}

export function topicsCountLabel(count: number): string {
  const lastTwo = count % 100;
  const last = count % 10;
  const noun = lastTwo >= 11 && lastTwo <= 14 ? "тем" : last === 1 ? "тема" : last >= 2 && last <= 4 ? "темы" : "тем";
  return `${count} ${noun}`;
}
