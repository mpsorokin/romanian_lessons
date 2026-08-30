import type { ReadableContent } from "@/lib/content.types";

const bodyLoaders: Record<ReadableContent["type"], Record<string, () => Promise<string>>> = {
  lesson: import.meta.glob<string>("../content/lessons/*.md", { query: "?raw", import: "default" }),
  "lesson-reference": import.meta.glob<string>("../content/lesson-references/*.md", { query: "?raw", import: "default" }),
  story: import.meta.glob<string>("../content/stories/*.md", { query: "?raw", import: "default" }),
  grammar: import.meta.glob<string>("../content/grammar/*.md", { query: "?raw", import: "default" }),
};

const DIRECTORIES: Record<ReadableContent["type"], string> = {
  lesson: "lessons",
  "lesson-reference": "lesson-references",
  story: "stories",
  grammar: "grammar",
};

const FRONTMATTER = /^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/;

/**
 * Small LRU rather than an unbounded map: bodies are whole articles, and keeping
 * every one ever opened would pin megabytes of strings for the life of the tab.
 * Going back one or two texts is the only access pattern that matters.
 */
const BODY_CACHE_LIMIT = 8;
const bodyCache = new Map<string, string>();

function readCache(key: string): string | undefined {
  const cached = bodyCache.get(key);
  if (cached === undefined) return undefined;
  // Re-insert so the most recently read entry is evicted last.
  bodyCache.delete(key);
  bodyCache.set(key, cached);
  return cached;
}

function writeCache(key: string, body: string): void {
  bodyCache.set(key, body);
  while (bodyCache.size > BODY_CACHE_LIMIT) {
    const oldest = bodyCache.keys().next();
    if (oldest.done) break;
    bodyCache.delete(oldest.value);
  }
}

/** Loads the markdown body of a single item; the frontmatter block is stripped here. */
export async function loadContentBody(item: ReadableContent): Promise<string> {
  const cacheKey = `${item.type}:${item.id}`;
  const cached = readCache(cacheKey);
  if (cached !== undefined) return cached;

  const loader = bodyLoaders[item.type][`../content/${DIRECTORIES[item.type]}/${item.file}`];
  if (!loader) throw new Error(`Missing content file for ${item.type} "${item.id}".`);

  const raw = await loader();
  const match = raw.match(FRONTMATTER);
  const body = (match ? match[1] : raw).trim();
  writeCache(cacheKey, body);
  return body;
}
