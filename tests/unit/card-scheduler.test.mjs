import test from "node:test";
import assert from "node:assert/strict";
import { applyReview, dateKey, REVIEW_INTERVALS } from "../../src/features/cards/scheduler.ts";

const day = (offset, hour = 12) => new Date(2026, 0, 1 + offset, hour, 0, 0, 0);

test("a new card starts at one day and needs three scheduled successes", () => {
  let transition = applyReview(undefined, "remembered", day(0), "today");
  assert.equal(transition.record.status, "learning");
  assert.equal(transition.record.dueDate, dateKey(day(1)));
  assert.equal(transition.record.successfulReviews, 0);

  transition = applyReview(transition.record, "remembered", day(1), "today");
  assert.equal(transition.record.dueDate, dateKey(day(4)));
  assert.equal(transition.record.intervalIndex, 1);
  assert.equal(transition.record.successfulReviews, 1);

  transition = applyReview(transition.record, "remembered", day(4), "today");
  transition = applyReview(transition.record, "remembered", day(11), "today");
  assert.equal(transition.record.status, "known");
  assert.equal(transition.record.successfulReviews, 3);
  assert.equal(transition.record.intervalIndex, 3);
  assert.equal(transition.record.dueDate, dateKey(day(25)));
});

test("same-day practice does not advance, while an error resets the schedule", () => {
  const first = applyReview(undefined, "remembered", day(0), "today").record;
  const early = applyReview(first, "remembered", day(0, 18), "today");
  assert.equal(early.attempt, "early");
  assert.equal(early.record.intervalIndex, 0);
  assert.equal(early.record.successfulReviews, 0);

  const scheduled = applyReview(first, "repeat", day(1), "today");
  assert.equal(scheduled.attempt, "scheduled");
  assert.equal(scheduled.record.dueDate, dateKey(day(2)));
  assert.equal(scheduled.record.successfulReviews, 0);
  assert.deepEqual(REVIEW_INTERVALS, [1, 3, 7, 14, 30, 60]);
});

test("an early remembered answer is logged but does not qualify for pause recall", () => {
  const first = applyReview(undefined, "remembered", day(0), "today").record;
  const early = applyReview(first, "remembered", day(1), "manual");
  assert.equal(early.attempt, "early");
  assert.equal(early.log.qualifiesForRecall, false);
});
