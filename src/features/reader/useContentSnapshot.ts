import { useRef } from "react";

/**
 * Reads a value once per content id and holds it until the id changes.
 *
 * A reader needs the position it *started* at. Re-reading on every render would
 * fight the scroll handler that is busy updating that same position, so the
 * snapshot is taken during render and then left alone.
 */
export function useContentSnapshot<T>(id: string | undefined, read: (id: string) => T): T | undefined {
  const snapshot = useRef<{ id: string; value: T } | null>(null);
  if (id && snapshot.current?.id !== id) snapshot.current = { id, value: read(id) };
  return snapshot.current?.value;
}
