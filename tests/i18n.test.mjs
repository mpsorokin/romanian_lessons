import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();
const pluralSuffix = /_(zero|one|two|few|many|other)$/;

function flattenKeys(value, prefix = "") {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value).flatMap(([key, nested]) => {
    const next = prefix ? `${prefix}.${key}` : key;
    if (nested !== null && typeof nested === "object" && !Array.isArray(nested)) {
      return flattenKeys(nested, next);
    }
    return [next];
  });
}

function baseKeys(keys) {
  return new Set([...keys].map((key) => key.replace(pluralSuffix, "")));
}

const en = JSON.parse(await readFile(join(root, "src", "i18n", "locales", "en.json"), "utf8"));
const ru = JSON.parse(await readFile(join(root, "src", "i18n", "locales", "ru.json"), "utf8"));

const enKeys = flattenKeys(en);
const ruKeys = flattenKeys(ru);
const enBase = baseKeys(enKeys);
const ruBase = baseKeys(ruKeys);

test("locale files expose the same translation keys", () => {
  const missingInRu = [...enBase].filter((key) => !ruBase.has(key));
  const missingInEn = [...ruBase].filter((key) => !enBase.has(key));

  assert.deepEqual(missingInRu, [], `Missing in ru.json: ${missingInRu.join(", ")}`);
  assert.deepEqual(missingInEn, [], `Missing in en.json: ${missingInEn.join(", ")}`);
});
