/// <reference types="vite/client" />

/** Injected by Vite from `package.json`. */
declare const __APP_VERSION__: string;

declare module "virtual:content-index" {
  import type { Lesson, Story } from "./lib/content.types";

  export const lessonIndex: Lesson[];
  export const storyIndex: Story[];
}
