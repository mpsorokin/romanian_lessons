import test from "node:test";
import assert from "node:assert/strict";
import { parseCardProgressState } from "../../src/features/cards/cardProgress.storage.ts";
import { getTotalCardProgress } from "../../src/features/cards/cardStats.ts";
import { generatedCardCount } from "../../src/generated/cards.count.ts";

const record = (overrides) => ({ status: "learning", attempts: 3, remembered: 1, updatedAt: "2026-01-01T00:00:00.000Z", ...overrides });

test("rejects anything that is not a version 1 state", () => {
  for (const value of [null, 7, [], {}, { version: 2 }]) {
    assert.equal(parseCardProgressState(value), null);
  }
});

test("counters are coerced to non-negative integers", () => {
  const parsed = parseCardProgressState({
    version: 1,
    cards: {
      a: record({ attempts: -4, remembered: -1 }),
      b: record({ attempts: 2.7, remembered: 1.9 }),
      c: record({ attempts: "x", remembered: "y" }),
    },
  });

  assert.deepEqual(parsed.cards.a, { status: "learning", attempts: 0, remembered: 0, updatedAt: record().updatedAt });
  assert.equal(parsed.cards.b.attempts, 2);
  assert.equal(parsed.cards.c.attempts, 0);
});

test("remembered can never exceed attempts", () => {
  const parsed = parseCardProgressState({ version: 1, cards: { a: record({ attempts: 2, remembered: 99 }) } });
  assert.equal(parsed.cards.a.remembered, 2);
});

test("the review queue is de-duplicated and stripped of junk, keeping insertion order", () => {
  const parsed = parseCardProgressState({
    version: 1,
    cards: {},
    needToReview: ["b", "a", "b", "", "   ", 5, null, "c"],
  });
  assert.deepEqual(parsed.needToReview, ["b", "a", "c"]);
});

test("a non-array review queue degrades to empty rather than throwing", () => {
  assert.deepEqual(parseCardProgressState({ version: 1, cards: {}, needToReview: "b" }).needToReview, []);
});

test("the collection rollup counts statuses and never exceeds the real card count", () => {
  const cards = {};
  for (let index = 0; index < generatedCardCount + 25; index += 1) {
    cards[`ghost-${index}`] = record({ status: "known" });
  }

  const rollup = getTotalCardProgress({ version: 1, cards, needToReview: [] });
  assert.equal(rollup.total, generatedCardCount);
  assert.equal(rollup.known, generatedCardCount, "stale ids cannot inflate the total");
  assert.equal(rollup.learning, 0);
  assert.equal(rollup.newCount, 0);
  assert.equal(rollup.percent, 1);
});

test("an empty rollup reports everything as new", () => {
  const rollup = getTotalCardProgress({ version: 1, cards: {}, needToReview: [] });
  assert.equal(rollup.known, 0);
  assert.equal(rollup.newCount, generatedCardCount);
  assert.equal(rollup.percent, 0);
});
