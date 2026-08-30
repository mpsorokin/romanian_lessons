import type { CSSProperties, ReactNode, RefObject } from "react";
import type { ReaderSettings } from "@/features/reader/readerSettings.types";

/**
 * The scrolling body shared by every reader screen. Font size and line height
 * reach the stylesheet as custom properties, which is why this style is inline
 * rather than in CSS.
 */
export function ReaderScrollArea({
  children,
  settings,
  scrollRef,
}: {
  children: ReactNode;
  settings: ReaderSettings;
  /** Omitted by screens that do not track a reading position. */
  scrollRef?: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      className="reader-scroll"
      ref={scrollRef}
      style={{ "--reader-size": `${settings.fontSize}px`, "--reader-line-height": settings.lineHeight } as CSSProperties}
    >
      {children}
    </div>
  );
}
