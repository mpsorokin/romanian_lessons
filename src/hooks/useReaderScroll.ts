import { useEffect, useRef } from "react";

function getProgress(element: HTMLElement) {
  const range = element.scrollHeight - element.clientHeight;
  return range > 0 ? Math.min(1, Math.max(0, element.scrollTop / range)) : 0;
}

export function useReaderScroll(
  contentId: string,
  initialPosition: number,
  onPositionChange: (position: number) => void,
) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const latestPosition = useRef(initialPosition);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    let cancelled = false;
    const restore = () => {
      if (cancelled) return;
      const range = element.scrollHeight - element.clientHeight;
      if (range > 0) element.scrollTop = Math.min(1, Math.max(0, initialPosition)) * range;
    };
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(restore);
    });
    document.fonts?.ready.then(restore).catch(() => undefined);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [contentId]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    let timeout: number | undefined;

    const flush = () => {
      timeout = undefined;
      onPositionChange(latestPosition.current);
    };
    const onScroll = () => {
      latestPosition.current = getProgress(element);
      if (timeout === undefined) timeout = window.setTimeout(flush, 250);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };

    element.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", flush);
    return () => {
      element.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", flush);
      if (timeout !== undefined) window.clearTimeout(timeout);
      flush();
    };
  }, [contentId, onPositionChange]);

  return scrollRef;
}
