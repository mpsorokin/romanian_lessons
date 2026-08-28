export interface ContentMeta {
  id: string;
  order: number;
  title: string;
  subtitle?: string;
  level?: string;
  wordCount?: number;
  /** File name inside `src/content/<lessons|stories>/`, used to load the body lazily. */
  file: string;
}

export interface Lesson extends ContentMeta {
  type: "lesson";
}

export interface Story extends ContentMeta {
  type: "story";
}

export type Content = Lesson | Story;

export interface Grammar {
  id: string;
  order: number;
  title: string;
  subtitle?: string;
  level?: string;
  category: string;
  tags?: string[];
  related?: string[];
  /** File name inside `src/content/grammar/`, used to load the body lazily. */
  file: string;
  type: "grammar";
}

export type ReadableContent = Content | Grammar;
