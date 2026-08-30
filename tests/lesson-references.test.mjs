import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();
const referencesDir = join(root, "src", "content", "lesson-references");
const lessonsDir = join(root, "src", "content", "lessons");
const wordsPath = join(referencesDir, "words.json");

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  const values = {};
  for (const line of match?.[1]?.split(/\r?\n/) ?? []) {
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    values[line.slice(0, separator).trim()] = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  return { values, body: match ? raw.slice(match[0].length) : raw };
}

const referenceFiles = (await readdir(referencesDir)).filter((file) => file.endsWith(".md")).sort();
const lessonFiles = (await readdir(lessonsDir)).filter((file) => file.endsWith(".md"));
const lessonIds = new Set();
for (const file of lessonFiles) {
  const { values } = parseFrontmatter(await readFile(join(lessonsDir, file), "utf8"));
  if (Number(values.order) <= 5) lessonIds.add(values.id);
}

test("lesson references cover exactly ordinary Lessons 1–4", async () => {
  assert.deepEqual(referenceFiles, ["01-reference.md", "02-reference.md", "03-reference.md", "04-reference.md"]);

  const references = [];
  for (const file of referenceFiles) {
    const parsed = parseFrontmatter(await readFile(join(referencesDir, file), "utf8"));
    references.push({ file, ...parsed.values, body: parsed.body });
  }

  assert.deepEqual(
    references.map((reference) => Number(reference.order)),
    [1, 2, 3, 4],
  );
  assert.equal(new Set(references.map((reference) => reference.id)).size, 4);
  assert.equal(new Set(references.map((reference) => reference.lessonId)).size, 4);

  for (const reference of references) {
    assert.ok(reference.id, `${reference.file} has an id`);
    assert.ok(lessonIds.has(reference.lessonId), `${reference.file} points to a Lesson 1–5 id`);
    assert.notEqual(reference.lessonId, "lesson-05", `${reference.file} does not target Recall 1`);
    assert.match(reference.body, /^## Grammar ref/m, `${reference.file} has a grammar section`);
    assert.match(reference.body, /^## Forms & tables/m, `${reference.file} has a forms section`);
    assert.match(reference.body, /^## Lesson words/m, `${reference.file} has a words section`);
    assert.match(reference.body, /^\|.+\|/m, `${reference.file} contains a Markdown table`);
  }
});

test("lesson reference words contain only ordered, unique headwords", async () => {
  const words = JSON.parse(await readFile(wordsPath, "utf8"));
  assert.ok(Array.isArray(words));
  assert.ok(words.length > 0);

  const allowedInfinitive = /^a\s+[^\s]+$/i;
  const seen = new Set();
  const lessonOrders = new Map();
  const expectedLessons = ["lesson-01", "lesson-02", "lesson-03", "lesson-04"];

  for (const word of words) {
    assert.ok(expectedLessons.includes(word.lessonId), `${word.word} belongs to Lessons 1–4`);
    assert.ok(Number.isInteger(word.order) && word.order > 0, `${word.lessonId} word order is positive`);
    assert.ok(word.word && word.pronunciation && word.meaning, `${word.lessonId} word has copy`);
    assert.doesNotMatch(word.word, /[.!?…,:;]/, `${word.word} is not a sentence or punctuation unit`);
    assert.ok(!/\s/.test(word.word) || allowedInfinitive.test(word.word), `${word.word} is a standalone word or infinitive`);

    const normalized = word.word.toLocaleLowerCase("ro-RO");
    assert.ok(!seen.has(normalized), `${word.word} is not duplicated across lessons`);
    seen.add(normalized);

    const orders = lessonOrders.get(word.lessonId) ?? [];
    orders.push(word.order);
    lessonOrders.set(word.lessonId, orders);

    if (word.noun) {
      assert.ok(["masculine", "feminine", "neuter"].includes(word.noun.gender));
      assert.ok(word.noun.plural && word.noun.pluralPronunciation);
      assert.match(word.noun.sourceUrl, /^https:\/\//);
    }
  }

  assert.deepEqual([...lessonOrders.keys()], expectedLessons);
  for (const [lessonId, orders] of lessonOrders) {
    assert.deepEqual(orders, [...orders].sort((a, b) => a - b), `${lessonId} words are ordered`);
    assert.equal(new Set(orders).size, orders.length, `${lessonId} word orders are unique`);
  }
});
