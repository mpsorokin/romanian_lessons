/**
 * Public entry point for content. The index (metadata, lookups) and the body
 * loader (lazy markdown) live in separate modules so a screen that only needs
 * titles never reaches for the loader.
 */
export * from "@/lib/content.index";
export * from "@/lib/content.body";

export type {
  Content,
  ContentMeta,
  Grammar,
  Lesson,
  LessonReference,
  LessonReferenceNoun,
  LessonReferenceWord,
  ReadableContent,
  Story,
} from "./content.types";
