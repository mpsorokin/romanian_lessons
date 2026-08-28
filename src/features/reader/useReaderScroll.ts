import { useEffect, useRef } from "react";

function getProgress(element: HTMLElement) {
  const range = element.scrollHeight - element.clientHeight;
  return range > 0 ? Math.min(1, Math.max(0, element.scrollTop / range)) : 0;
}

export function useReaderScroll(
  contentId: string,
  initialPosition: number,
  onPositionChange: (position: number) => void,
  /** Restoring before the body has rendered would land on an empty container. */
  ready = true,
) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const latestPosition = useRef(initialPosition);
  const dirty = useRef(false);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !ready) return;

    let cancelled = false;
    const restore = () => {
      if (cancelled) return;
      const range = element.scrollHeight - element.clientHeight;
      if (range > 0) element.scrollTop = Math.min(1, Math.max(0, initialPosition)) * range;
    };

    // Late font loading must not yank a reader who already started scrolling.
    const stopRestoring = () => {
      cancelled = true;
    };

    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(restore);
    });
    document.fonts?.ready.then(restore).catch(() => undefined);

    element.addEventListener("wheel", stopRestoring, { passive: true, once: true });
    element.addEventListener("touchstart", stopRestoring, { passive: true, once: true });
    window.addEventListener("keydown", stopRestoring, { once: true });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      element.removeEventListener("wheel", stopRestoring);
      element.removeEventListener("touchstart", stopRestoring);
      window.removeEventListener("keydown", stopRestoring);
    };
    // `initialPosition` is intentionally read once per content item.
  }, [contentId, ready]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !ready) return;
    let timeout: number | undefined;
    dirty.current = false;

    const flush = () => {
      timeout = undefined;
      if (!dirty.current) return;
      onPositionChange(latestPosition.current);
    };
    const onScroll = () => {
      latestPosition.current = getProgress(element);
      dirty.current = true;
      if (timeout === undefined) timeout = window.setTimeout(flush, 250);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };

    element.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    // `pagehide` fires on mobile tab teardown where `beforeunload` does not.
    window.addEventListener("pagehide", flush);

    return () => {
      element.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", flush);
      if (timeout !== undefined) window.clearTimeout(timeout);
      flush();
    };
  }, [contentId, onPositionChange, ready]);

  return scrollRef;
}
