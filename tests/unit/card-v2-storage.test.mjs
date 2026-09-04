import test from "node:test";
import assert from "node:assert/strict";
import { createInitialCardProgressV2, mergeCardProgressV2, migrateLegacyProgress, parseCardProgressStateV2 } from "../../src/features/cards/cardProgress.v2.storage.ts";

test("legacy progress migrates without inventing scheduled history", () => {
  const migrated = migrateLegacyProgress({ "lesson-01:card-01": { status: "known", attempts: 7, remembered: 6, updatedAt: "2026-01-01T12:00:00.000Z" } }, ["lesson-01:card-01"]);
  const card = migrated.cards["lesson-01:card-01"];
  assert.equal(card.status, "learning");
  assert.equal(card.dueDate, migrated.daily.date);
  assert.equal(card.successfulReviews, 0);
  assert.equal(card.firstStudiedAt, null);
  assert.equal(card.attempts, 7);
  assert.deepEqual(migrated.needToReview, ["lesson-01:card-01"]);
});

test("persisted Today queues retain duplicate retry displays", () => {
  const state = createInitialCardProgressV2("2026-01-10");
  state.activeSession = {
    id: "today-1", cardIds: ["a", "b", "a"], index: 1, revealed: true, retryCounts: { a: 1 },
    remembered: 0, repeat: 1, errors: 1, newCount: 1, firstRecallCount: 0, retryCount: 0,
    difficult: ["a"], startedAt: "2026-01-10T12:00:00.000Z", primaryTotal: 2,
  };
  const parsed = parseCardProgressStateV2(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(parsed.activeSession.cardIds, ["a", "b", "a"]);
});

test("a reset tombstone wins over a stale tab", () => {
  const local = createInitialCardProgressV2("2026-01-10");
  local.cards.a = { status: "learning", attempts: 1, remembered: 0, updatedAt: "2026-01-10T12:00:00.000Z", intervalIndex: 0, dueDate: "2026-01-11", successfulReviews: 0, firstStudiedAt: null, lastReviewedAt: null, lastScheduledReviewAt: null };
  const reset = { ...createInitialCardProgressV2("2026-01-10"), resetAt: "2026-01-10T13:00:00.000Z" };
  const stale = { ...local, resetAt: null };
  assert.equal(mergeCardProgressV2(reset, stale).cards.a, undefined);
});

test("merging two tabs keeps each review once, in first-seen order", () => {
  const entry = (id, answeredAt) => ({
    id, cardId: "a", result: "remembered", type: "scheduled",
    answeredAt, previousAnsweredAt: null, pauseHours: 25, qualifiesForRecall: true,
  });
  const now = new Date();
  const iso = (minutes) => new Date(now.getTime() - minutes * 60_000).toISOString();

  const local = createInitialCardProgressV2("2026-01-10");
  local.cards.a = { status: "learning", attempts: 1, remembered: 1, updatedAt: iso(30), intervalIndex: 0, dueDate: "2026-01-11", successfulReviews: 1, firstStudiedAt: null, lastReviewedAt: null, lastScheduledReviewAt: null };
  local.reviewLog = [entry("a:1", iso(30)), entry("a:2", iso(20))];

  const incoming = { ...createInitialCardProgressV2("2026-01-10"), cards: local.cards };
  incoming.reviewLog = [entry("a:2", iso(20)), entry("a:3", iso(10))];

  const merged = mergeCardProgressV2(local, incoming);
  assert.deepEqual(merged.reviewLog.map((item) => item.id), ["a:1", "a:2", "a:3"]);
});

test("an expired review drops out of the merged log", () => {
  const old = {
    id: "a:old", cardId: "a", result: "remembered", type: "scheduled",
    answeredAt: new Date(Date.now() - 91 * 24 * 3_600_000).toISOString(),
    previousAnsweredAt: null, pauseHours: 25, qualifiesForRecall: true,
  };
  const local = { ...createInitialCardProgressV2("2026-01-10"), reviewLog: [old] };
  const incoming = { ...createInitialCardProgressV2("2026-01-10"), reviewLog: [old] };
  assert.deepEqual(mergeCardProgressV2(local, incoming).reviewLog, []);
});
