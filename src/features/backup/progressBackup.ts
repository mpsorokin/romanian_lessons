import { parseCardProgressState } from "@/features/cards/cardProgress.storage";
import { parseCardProgressStateV2 } from "@/features/cards/cardProgress.v2.storage";
import { isCardProgressV2, type CardProgressState, type CardProgressStateV2 } from "@/features/cards/cardProgress.types";
import { parseProgressState } from "@/features/progress/progress.storage";
import type { ProgressState } from "@/features/progress/progress.types";

export const PROGRESS_BACKUP_KIND = "calea-progress";
export const PROGRESS_BACKUP_VERSION = 1;
export const PROGRESS_BACKUP_V2_VERSION = 2;

export interface ProgressBackupV1 {
  kind: typeof PROGRESS_BACKUP_KIND;
  version: typeof PROGRESS_BACKUP_VERSION;
  exportedAt: string;
  reading: ProgressState;
  cards: CardProgressState;
}

export interface ProgressBackupV2 {
  kind: typeof PROGRESS_BACKUP_KIND;
  version: typeof PROGRESS_BACKUP_V2_VERSION;
  exportedAt: string;
  reading: ProgressState;
  cards: CardProgressStateV2;
}

export type ProgressBackup = ProgressBackupV1 | ProgressBackupV2;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function createProgressBackup(reading: ProgressState, cards: CardProgressState): ProgressBackupV1;
export function createProgressBackup(reading: ProgressState, cards: CardProgressStateV2): ProgressBackupV2;
export function createProgressBackup(reading: ProgressState, cards: CardProgressState | CardProgressStateV2): ProgressBackup {
  if (isCardProgressV2(cards)) {
    return {
      kind: PROGRESS_BACKUP_KIND,
      version: PROGRESS_BACKUP_V2_VERSION,
      exportedAt: new Date().toISOString(),
      reading,
      cards,
    };
  }
  return {
    kind: PROGRESS_BACKUP_KIND,
    version: PROGRESS_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    reading,
    cards,
  };
}

export function parseProgressBackup(value: unknown): ProgressBackup | null {
  if (!isRecord(value)) return null;
  if (value.kind !== PROGRESS_BACKUP_KIND) return null;
  if (typeof value.exportedAt !== "string" || value.exportedAt.length === 0) return null;

  const reading = parseProgressState(value.reading);
  if (!reading) return null;

  const exportedAt = value.exportedAt;
  if (value.version === PROGRESS_BACKUP_V2_VERSION) {
    const cards = parseCardProgressStateV2(value.cards);
    return cards && { kind: PROGRESS_BACKUP_KIND, version: PROGRESS_BACKUP_V2_VERSION, exportedAt, reading, cards };
  }
  if (value.version === PROGRESS_BACKUP_VERSION) {
    const cards = parseCardProgressState(value.cards);
    return cards && { kind: PROGRESS_BACKUP_KIND, version: PROGRESS_BACKUP_VERSION, exportedAt, reading, cards };
  }
  return null;
}

export function progressBackupFilename(date = new Date()): string {
  const day = date.toISOString().slice(0, 10);
  return `calea-progress-${day}.json`;
}

/**
 * The anchor has to live in the document and the blob URL has to outlive the
 * click: Firefox and Safari cancel a download whose object URL is revoked in the
 * same tick, which silently loses the only backup the learner can make.
 */
export function downloadProgressBackup(backup: ProgressBackup): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = progressBackupFilename();
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  window.setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(url);
  }, 0);
}
