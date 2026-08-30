import test from "node:test";
import assert from "node:assert/strict";
import { filterGrammarTopics, getGrammarCategory, groupGrammarTopics } from "../../src/features/grammar/grammar.ts";

const topic = (id, extra = {}) => ({ id, order: 1, title: id, file: `${id}.md`, type: "grammar", category: "verbs", ...extra });

const topics = [
  topic("articol", { title: "Articolul hotărât", subtitle: "Определённый артикль", tags: ["substantiv"], category: "nouns-adjectives" }),
  topic("prezent", { title: "Prezentul", subtitle: "Настоящее время", tags: ["verb", "timp"], category: "verbs" }),
  topic("pronume", { title: "Pronume personale", category: "pronouns" }),
];

test("an empty query returns the very same array, so callers keep their memo", () => {
  assert.equal(filterGrammarTopics(topics, ""), topics);
  assert.equal(filterGrammarTopics(topics, "   "), topics);
});

test("search is case-insensitive", () => {
  assert.deepEqual(filterGrammarTopics(topics, "PREZENTUL").map((t) => t.id), ["prezent"]);
  assert.deepEqual(filterGrammarTopics(topics, "prezentul").map((t) => t.id), ["prezent"]);
});

test("search ignores Romanian diacritics in both the query and the source", () => {
  assert.deepEqual(filterGrammarTopics(topics, "hotarat").map((t) => t.id), ["articol"]);
  assert.deepEqual(filterGrammarTopics(topics, "hotărât").map((t) => t.id), ["articol"]);
});

test("subtitle and tags are searchable, not just the title", () => {
  assert.deepEqual(filterGrammarTopics(topics, "определённый").map((t) => t.id), ["articol"]);
  assert.deepEqual(filterGrammarTopics(topics, "timp").map((t) => t.id), ["prezent"]);
});

test("a topic without a subtitle or tags still matches on its title", () => {
  assert.deepEqual(filterGrammarTopics(topics, "personale").map((t) => t.id), ["pronume"]);
});

test("no match yields an empty list rather than everything", () => {
  assert.deepEqual(filterGrammarTopics(topics, "zzzz"), []);
});

test("repeated searches stay correct once a topic's text has been folded and cached", () => {
  filterGrammarTopics(topics, "prezent");
  filterGrammarTopics(topics, "articol");
  assert.deepEqual(filterGrammarTopics(topics, "prezentul").map((t) => t.id), ["prezent"]);
});

test("grouping orders categories by the catalogue and topics by order", () => {
  const groups = groupGrammarTopics(topics);
  assert.deepEqual(groups.map((group) => group.category.id), ["nouns-adjectives", "pronouns", "verbs"]);
});

test("grouping never mutates the array it is given", () => {
  const input = [...topics];
  groupGrammarTopics(input);
  assert.deepEqual(input, topics, "the shared catalogue array must survive being grouped");
});

test("an unknown category sorts last instead of throwing", () => {
  const category = getGrammarCategory("not-a-category");
  assert.equal(category.id, "not-a-category");
  assert.equal(category.order, Number.MAX_SAFE_INTEGER);
});
