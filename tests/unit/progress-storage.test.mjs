import test from "node:test";
import assert from "node:assert/strict";
import {
  PROGRESS_STORAGE_KEY,
  mergeProgress,
  parseProgressState,
  readProgress,
} from "../../src/features/progress/progress.storage.ts";
import { backupKeyFor } from "../../src/lib/storage.ts";
import { installFakeStorage } from "../support/fake-storage.mjs";

const lesson = (overrides) => ({ status: "in-progress", resumePosition: 0.5, updatedAt: "2026-01-01T00:00:00.000Z", ...overrides });

test("rejects anything that is not a version 1 state", () => {
  for (const value of [null, undefined, 42, "x", [], {}, { version: 2, lessons: {} }, { version: "1" }]) {
    assert.equal(parseProgressState(value), null, `should reject ${JSON.stringify(value)}`);
  }
});

test("keeps only well-formed records and clamps positions", () => {
  const parsed = parseProgressState({
    version: 1,
    lessons: {
      good: lesson({ resumePosition: 1.7 }),
      negative: lesson({ resumePosition: -3 }),
      unparseable: lesson({ resumePosition: "abc" }),
      noTimestamp: { status: "in-progress", resumePosition: 0.2 },
      badStatus: lesson({ status: "halfway" }),
      notAnObject: "nope",
    },
    stories: { s: { resumePosition: 0.4, completed: "yes", updatedAt: "2026-01-01T00:00:00.000Z" } },
    grammar: "not an object",
  });

  assert.deepEqual(Object.keys(parsed.lessons).sort(), ["good", "negative", "unparseable"]);
  assert.equal(parsed.lessons.good.resumePosition, 1, "positions above 1 are clamped");
  assert.equal(parsed.lessons.negative.resumePosition, 0);
  assert.equal(parsed.lessons.unparseable.resumePosition, 0, "unparseable positions fall back to 0");
  assert.equal(parsed.stories.s.completed, false, "only a real boolean true counts as completed");
  assert.deepEqual(parsed.grammar, {});
});

test("an optional completedAt survives a round trip and an empty one is dropped", () => {
  const withDate = parseProgressState({
    version: 1,
    lessons: { a: lesson({ status: "completed", completedAt: "2026-02-02T00:00:00.000Z" }) },
  });
  assert.equal(withDate.lessons.a.completedAt, "2026-02-02T00:00:00.000Z");

  const withoutDate = parseProgressState({ version: 1, lessons: { a: lesson({ status: "completed", completedAt: "" }) } });
  assert.equal("completedAt" in withoutDate.lessons.a, false);
});

test("an unreadable blob is preserved instead of being overwritten", () => {
  const storage = installFakeStorage();
  storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ version: 99, lessons: { a: lesson() } }));

  const state = readProgress();

  assert.deepEqual(state, { version: 1, lessons: {}, stories: {}, grammar: {} }, "the app still starts");
  assert.equal(
    JSON.parse(storage.getItem(backupKeyFor(PROGRESS_STORAGE_KEY))).version,
    99,
    "the unrecognised state is kept so it can be recovered",
  );
});

test("the first unreadable blob wins the backup slot", () => {
  const storage = installFakeStorage();
  storage.setItem(PROGRESS_STORAGE_KEY, '{"version":99,"marker":"original"}');
  readProgress();
  storage.setItem(PROGRESS_STORAGE_KEY, '{"version":99,"marker":"later"}');
  readProgress();

  assert.match(storage.getItem(backupKeyFor(PROGRESS_STORAGE_KEY)), /original/);
});

test("broken JSON is backed up too, not silently dropped", () => {
  const storage = installFakeStorage();
  storage.setItem(PROGRESS_STORAGE_KEY, "{not json");
  readProgress();
  assert.equal(storage.getItem(backupKeyFor(PROGRESS_STORAGE_KEY)), "{not json");
});

test("a missing key is a fresh start, with nothing backed up", () => {
  const storage = installFakeStorage();
  assert.deepEqual(readProgress(), { version: 1, lessons: {}, stories: {}, grammar: {} });
  assert.equal(storage.getItem(backupKeyFor(PROGRESS_STORAGE_KEY)), null);
});

test("merging another tab's state takes the newer record per entry", () => {
  const local = {
    version: 1,
    lessons: { a: lesson({ updatedAt: "2026-03-01T00:00:00.000Z", resumePosition: 0.9 }) },
    stories: {},
    grammar: {},
  };
  const incoming = {
    version: 1,
    lessons: {
      a: lesson({ updatedAt: "2026-01-01T00:00:00.000Z", resumePosition: 0.1 }),
      b: lesson({ updatedAt: "2026-01-01T00:00:00.000Z" }),
    },
    stories: {},
    grammar: {},
  };

  const merged = mergeProgress(local, incoming);
  assert.equal(merged.lessons.a.resumePosition, 0.9, "our newer record survives");
  assert.ok(merged.lessons.b, "the other tab's extra lesson is adopted");
});

test("a reset in another tab is not undone by what this tab remembers", () => {
  const local = { version: 1, lessons: { a: lesson() }, stories: {}, grammar: {} };
  const incoming = { version: 1, lessons: {}, stories: {}, grammar: {} };
  assert.deepEqual(mergeProgress(local, incoming).lessons, {}, "deletions must win");
});
