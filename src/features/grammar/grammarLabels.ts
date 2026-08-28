import type { TFunction } from "i18next";

type GrammarCategoryId =
  | "nouns-adjectives"
  | "pronouns"
  | "verbs"
  | "tenses-moods"
  | "sentence-structure"
  | "useful-language";

const grammarCategoryIds = new Set<string>([
  "nouns-adjectives",
  "pronouns",
  "verbs",
  "tenses-moods",
  "sentence-structure",
  "useful-language",
]);

export function grammarCategoryLabel(t: TFunction, categoryId: string): string {
  if (grammarCategoryIds.has(categoryId)) {
    return t(`grammar.category.${categoryId as GrammarCategoryId}`);
  }
  return categoryId;
}
