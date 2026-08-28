/// <reference types="vite/client" />

/** Injected by Vite from `package.json`. */
declare const __APP_VERSION__: string;

declare module "virtual:content-index" {
  import type { Grammar, Lesson, Story } from "./lib/content.types";

  export const lessonIndex: Lesson[];
  export const storyIndex: Story[];
  export const grammarIndex: Grammar[];
}
