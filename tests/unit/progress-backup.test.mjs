import test from "node:test";
import assert from "node:assert/strict";
import {
  PROGRESS_BACKUP_KIND,
  PROGRESS_BACKUP_VERSION,
  createProgressBackup,
  parseProgressBackup,
  progressBackupFilename,
} from "../../src/features/backup/progressBackup.ts";

const reading = {
  version: 1,
  lessons: { "lesson-01": { status: "completed", resumePosition: 1, updatedAt: "2026-01-01T00:00:00.000Z", completedAt: "2026-01-01T00:00:00.000Z" } },
  stories: { "story-01": { resumePosition: 0.42, completed: false, updatedAt: "2026-01-02T00:00:00.000Z" } },
  grammar: { "grammar-01": { resumePosition: 0.3, updatedAt: "2026-01-03T00:00:00.000Z" } },
};
const cards = {
  version: 1,
  cards: { "lesson-01:card-01": { status: "known", attempts: 4, remembered: 3, updatedAt: "2026-01-04T00:00:00.000Z" } },
  needToReview: ["lesson-01:card-02"],
};

test("an exported backup parses back into exactly the same progress", () => {
  const backup = createProgressBackup(reading, cards);
  const restored = parseProgressBackup(JSON.parse(JSON.stringify(backup)));

  assert.ok(restored);
  assert.deepEqual(restored.reading, reading);
  assert.deepEqual(restored.cards, cards);
  assert.equal(restored.kind, PROGRESS_BACKUP_KIND);
  assert.equal(restored.version, PROGRESS_BACKUP_VERSION);
});

test("a foreign or damaged file is refused rather than half-imported", () => {
  const backup = createProgressBackup(reading, cards);
  const cases = {
    "wrong kind": { ...backup, kind: "someone-elses-app" },
    "future version": { ...backup, version: 2 },
    "missing timestamp": { ...backup, exportedAt: "" },
    "unreadable reading state": { ...backup, reading: { version: 5 } },
    "unreadable card state": { ...backup, cards: null },
    "not an object": "just a string",
  };

  for (const [name, value] of Object.entries(cases)) {
    assert.equal(parseProgressBackup(value), null, `should refuse: ${name}`);
  }
});

test("the filename carries the export date", () => {
  assert.equal(progressBackupFilename(new Date("2026-08-30T21:15:00.000Z")), "calea-progress-2026-08-30.json");
});
