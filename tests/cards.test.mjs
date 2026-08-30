import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();
const lessonsDir = join(root, "src", "content", "lessons");
const nounMetadataPath = join(root, "src", "content", "cards", "nouns.json");
const generatedPath = join(root, "src", "generated", "cards.generated.ts");

function readGeneratedArray(source, name) {
  const match = source.match(new RegExp(`export const ${name}[^=]*= ([\\s\\S]*?);\\n`));
  assert.ok(match, `Generated array ${name} is missing.`);
  return JSON.parse(match[1]);
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n-{3,}(?:\r?\n|$)/);
  const values = {};
  for (const line of match?.[1]?.split(/\r?\n/) ?? []) {
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    values[line.slice(0, separator).trim()] = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  return values;
}

const generated = await readFile(generatedPath, "utf8");
const cards = readGeneratedArray(generated, "generatedStudyCards");
const decks = readGeneratedArray(generated, "generatedCardDecks");
const nounMetadata = JSON.parse(await readFile(nounMetadataPath, "utf8"));
const lessonFiles = (await readdir(lessonsDir)).filter((file) => file.endsWith(".md"));
const lessons = [];
for (const file of lessonFiles) {
  const meta = parseFrontmatter(await readFile(join(lessonsDir, file), "utf8"));
  lessons.push({
    id: meta.id,
    order: Number(meta.order),
    wordCount: Number(meta.wordCount ?? 0),
  });
}
lessons.sort((a, b) => a.order - b.order);

test("every ordinary lesson has the declared number of ordered unique cards", () => {
  const ids = new Set();
  const lessonIds = new Set(lessons.map((lesson) => lesson.id));
  for (const card of cards) {
    assert.equal(ids.has(card.id), false, `Duplicate card id: ${card.id}`);
    assert.equal(lessonIds.has(card.lessonId), true, `Unknown lesson for card: ${card.id}`);
    ids.add(card.id);
  }

  for (const lesson of lessons) {
    const lessonCards = cards.filter((card) => card.lessonId === lesson.id);
    assert.equal(lessonCards.length, lesson.wordCount, `${lesson.id} card count`);
    assert.deepEqual(
      lessonCards.map((card) => card.order),
      Array.from({ length: lesson.wordCount }, (_, index) => index + 1),
      `${lesson.id} card order`,
    );
    for (const card of lessonCards) {
      assert.ok(card.promptRu && card.answerRo && card.pronunciation, `${card.id} has complete copy`);
    }
  }
});

test("card decks include only ordinary lessons and preserve lesson numbering", () => {
  const lessonIds = new Set(lessons.map((lesson) => lesson.id));
  const deckIds = new Set();
  const ordinary = lessons.filter((lesson) => lesson.wordCount > 0);

  assert.deepEqual(
    lessons.map((lesson) => lesson.order),
    Array.from({ length: lessons.length }, (_, index) => index + 1),
  );
  assert.deepEqual(
    decks.map((deck) => deck.lessonId),
    ordinary.map((lesson) => lesson.id),
  );

  for (const lesson of lessons) {
    const deck = decks.find((item) => item.id === lesson.id);
    if (lesson.wordCount > 0) {
      assert.ok(deck, `Missing deck for ${lesson.id}`);
      assert.equal(deckIds.has(deck.id), false, `Duplicate deck id: ${deck.id}`);
      deckIds.add(deck.id);
      assert.equal(deck.lessonId, lesson.id);
      assert.equal(deck.kind, "lesson");
      assert.deepEqual(deck.sourceLessonIds, [lesson.id]);
    } else {
      assert.equal(deck, undefined, `Recall lesson ${lesson.id} must not have a card deck`);
    }
  }

  assert.equal(decks.length, ordinary.length);
  for (const deck of decks) {
    assert.ok(lessonIds.has(deck.lessonId), `Unknown lesson ${deck.lessonId}`);
  }
});

test("noun metadata is complete, sourced, and attached to existing cards", () => {
  const validGenders = new Set(["masculine", "feminine", "neuter"]);
  const cardsByKey = new Map(cards.map((card) => [`${card.lessonId}:${card.answerRo.toLocaleLowerCase("ro-RO")}`, card]));
  const nounCards = cards.filter((card) => card.noun);

  assert.ok(Array.isArray(nounMetadata));
  assert.equal(nounCards.length, nounMetadata.length, "Every registry entry should produce one noun card.");

  for (const noun of nounMetadata) {
    for (const field of ["lessonId", "answerRo", "lemma", "gender", "plural", "pluralPronunciation", "sourceUrl"]) {
      assert.equal(typeof noun[field], "string", `${field} must be a string for ${noun.lessonId}/${noun.answerRo}`);
      assert.ok(noun[field].trim(), `${field} must not be empty for ${noun.lessonId}/${noun.answerRo}`);
    }
    assert.ok(validGenders.has(noun.gender), `Invalid gender for ${noun.lessonId}/${noun.answerRo}`);
    assert.match(noun.pluralPronunciation, /[А-Яа-яЁё]/, `Missing transcription for ${noun.lessonId}/${noun.answerRo}`);
    assert.match(noun.sourceUrl, /^https:\/\//, `Source must use HTTPS for ${noun.lessonId}/${noun.answerRo}`);

    const card = cardsByKey.get(`${noun.lessonId}:${noun.answerRo.toLocaleLowerCase("ro-RO")}`);
    assert.ok(card, `No generated card for ${noun.lessonId}/${noun.answerRo}`);
    assert.deepEqual(card.noun, {
      lemma: noun.lemma,
      gender: noun.gender,
      plural: noun.plural,
      pluralPronunciation: noun.pluralPronunciation,
      sourceUrl: noun.sourceUrl,
    });
  }
});
