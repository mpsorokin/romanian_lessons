import test from "node:test";
import assert from "node:assert/strict";
import { IDLE, sessionReducer } from "../../src/features/cards/studySession.state.ts";

const card = (id) => ({ id, lessonId: "lesson-01", order: 1, promptRu: "п", answerRo: "a", pronunciation: "а" });
const deck = [card("a"), card("b"), card("c")];

const answer = (state, result) =>
  sessionReducer(state, { type: "answer", result, card: state.cards[state.index] });

test("start clears the previous session but keeps the difficult cards to replay", () => {
  const previous = { ...IDLE, remembered: 4, repeat: 2, lastDifficult: [card("x")], summaryVisible: true };
  const started = sessionReducer(previous, { type: "start", cards: deck });

  assert.deepEqual(started.cards, deck);
  assert.equal(started.index, 0);
  assert.equal(started.revealed, false);
  assert.equal(started.remembered, 0);
  assert.equal(started.repeat, 0);
  assert.equal(started.summaryVisible, false);
  assert.deepEqual(started.lastDifficult, [card("x")], "the replay list must survive a restart");
});

test("answering advances the card and resets the reveal", () => {
  let state = sessionReducer(IDLE, { type: "start", cards: deck });
  state = sessionReducer(state, { type: "reveal" });
  assert.equal(state.revealed, true);

  state = answer(state, "remembered");
  assert.equal(state.index, 1);
  assert.equal(state.revealed, false, "the next card must start face down");
  assert.equal(state.remembered, 1);
  assert.equal(state.repeat, 0);
});

test("cards graded repeat are collected in order", () => {
  let state = sessionReducer(IDLE, { type: "start", cards: deck });
  state = answer(state, "repeat");
  state = answer(state, "remembered");

  assert.deepEqual(
    state.difficult.map((entry) => entry.id),
    ["a"],
  );
});

test("the last answer ends the session and hands the difficult cards to the summary", () => {
  let state = sessionReducer(IDLE, { type: "start", cards: deck });
  state = answer(state, "repeat");
  state = answer(state, "remembered");
  state = answer(state, "repeat");

  assert.equal(state.cards, null, "no session is running once the deck runs out");
  assert.equal(state.summaryVisible, true);
  assert.equal(state.remembered, 1);
  assert.equal(state.repeat, 2);
  assert.deepEqual(state.difficult, [], "the running list is cleared");
  assert.deepEqual(
    state.lastDifficult.map((entry) => entry.id),
    ["a", "c"],
    "the summary replays exactly the cards that were marked for repetition",
  );
});

test("a single-card session summarises immediately", () => {
  let state = sessionReducer(IDLE, { type: "start", cards: [card("only")] });
  state = answer(state, "remembered");

  assert.equal(state.cards, null);
  assert.equal(state.summaryVisible, true);
  assert.equal(state.remembered, 1);
});

test("leaving resets everything, including the replay list", () => {
  let state = sessionReducer(IDLE, { type: "start", cards: deck });
  state = answer(state, "repeat");
  assert.deepEqual(sessionReducer(state, { type: "leave" }), IDLE);
});

test("answering without a running session is a no-op", () => {
  const state = sessionReducer(IDLE, { type: "answer", result: "remembered", card: card("a") });
  assert.equal(state, IDLE);
});
