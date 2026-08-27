/// <reference types="vite/client" />

declare module "virtual:content-index" {
  import type { Lesson, Story } from "./lib/content.types";

  export const lessonIndex: Lesson[];
  export const storyIndex: Story[];
}
