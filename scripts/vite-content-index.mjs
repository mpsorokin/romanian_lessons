import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";

const VIRTUAL_ID = "virtual:content-index";
const RESOLVED_ID = "\0" + VIRTUAL_ID;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?[\s\S]*$/;

const GROUPS = [
  { type: "lesson", dir: "lessons" },
  { type: "story", dir: "stories" },
];

function asRequiredString(value, field, source) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Invalid ${field} in ${source}: expected a non-empty string.`);
  }
  return value.trim();
}

function asOptionalString(value, field, source) {
  if (value === undefined || value === null || value === "") return undefined;
  return asRequiredString(value, field, source);
}

function asRequiredNumber(value, field, source) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`Invalid ${field} in ${source}: expected a number.`);
  }
  return number;
}

async function readGroup(contentRoot, group) {
  const dir = path.join(contentRoot, group.dir);
  const files = (await readdir(dir)).filter((file) => file.endsWith(".md")).sort();
  const items = files.map(() => null);

  await Promise.all(
    files.map(async (file, position) => {
      const source = `src/content/${group.dir}/${file}`;
      const raw = await readFile(path.join(dir, file), "utf8");
      const match = raw.match(FRONTMATTER);
      if (!match) throw new Error(`Missing YAML frontmatter in ${source}.`);

      const frontmatter = parseYaml(match[1]);
      if (!frontmatter || typeof frontmatter !== "object" || Array.isArray(frontmatter)) {
        throw new Error(`Invalid YAML frontmatter in ${source}.`);
      }

      const wordCount =
        frontmatter.wordCount === undefined || frontmatter.wordCount === null
          ? undefined
          : asRequiredNumber(frontmatter.wordCount, "wordCount", source);

      items[position] = {
        id: asRequiredString(frontmatter.id, "id", source),
        order: asRequiredNumber(frontmatter.order, "order", source),
        title: asRequiredString(frontmatter.title, "title", source),
        subtitle: asOptionalString(frontmatter.subtitle, "subtitle", source),
        level: asOptionalString(frontmatter.level, "level", source),
        wordCount,
        type: group.type,
        file,
      };
    }),
  );

  const orders = new Map();
  for (const item of items) {
    const previous = orders.get(item.order);
    if (previous) {
      throw new Error(`Duplicate order ${item.order} in ${group.dir}: ${previous} and ${item.file}.`);
    }
    orders.set(item.order, item.file);
  }

  items.sort((a, b) => a.order - b.order);
  return items;
}

function assertUniqueIds(items) {
  const seen = new Map();
  for (const item of items) {
    const previous = seen.get(item.id);
    if (previous) {
      throw new Error(`Duplicate content id "${item.id}" in ${previous} and ${item.file}. IDs must be unique.`);
    }
    seen.set(item.id, item.file);
  }
}

async function buildIndex(contentRoot) {
  const [lessons, stories] = await Promise.all(GROUPS.map((group) => readGroup(contentRoot, group)));
  assertUniqueIds([...lessons, ...stories]);
  return [
    `export const lessonIndex = ${JSON.stringify(lessons)};`,
    `export const storyIndex = ${JSON.stringify(stories)};`,
    "",
  ].join("\n");
}

/**
 * Parses the YAML frontmatter of every content file at build time and exposes it
 * as `virtual:content-index`, so the browser bundle carries neither the `yaml`
 * parser nor the markdown bodies. Bodies stay lazy via `import.meta.glob`.
 */
export function contentIndexPlugin() {
  let contentRoot = "";

  return {
    name: "calea-content-index",

    configResolved(config) {
      contentRoot = path.join(config.root, "src", "content");
    },

    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },

    async load(id) {
      if (id !== RESOLVED_ID) return null;
      return buildIndex(contentRoot);
    },

    configureServer(server) {
      const invalidate = (file) => {
        if (!file.endsWith(".md") || !path.resolve(file).startsWith(contentRoot)) return;
        const module = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (module) server.moduleGraph.invalidateModule(module);
        const hot = server.hot ?? server.ws;
        hot?.send({ type: "full-reload" });
      };

      server.watcher.on("add", invalidate);
      server.watcher.on("change", invalidate);
      server.watcher.on("unlink", invalidate);
    },
  };
}
