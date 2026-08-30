import { parseCardProgressState } from "@/features/cards/cardProgress.storage";
import type { CardProgressState } from "@/features/cards/cardProgress.types";
import { parseProgressState } from "@/features/progress/progress.storage";
import type { ProgressState } from "@/features/progress/progress.types";

export const PROGRESS_BACKUP_KIND = "calea-progress";
export const PROGRESS_BACKUP_VERSION = 1;

export interface ProgressBackup {
  kind: typeof PROGRESS_BACKUP_KIND;
  version: typeof PROGRESS_BACKUP_VERSION;
  exportedAt: string;
  reading: ProgressState;
  cards: CardProgressState;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function createProgressBackup(reading: ProgressState, cards: CardProgressState): ProgressBackup {
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
  if (value.kind !== PROGRESS_BACKUP_KIND || value.version !== PROGRESS_BACKUP_VERSION) return null;
  if (typeof value.exportedAt !== "string" || value.exportedAt.length === 0) return null;

  const reading = parseProgressState(value.reading);
  const cards = parseCardProgressState(value.cards);
  if (!reading || !cards) return null;

  return {
    kind: PROGRESS_BACKUP_KIND,
    version: PROGRESS_BACKUP_VERSION,
    exportedAt: value.exportedAt,
    reading,
    cards,
  };
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
