import type { ReactNode } from "react";

/**
 * The reading frame. `theme` drives both the surrounding page colour and the
 * `--r-*` aliases defined in `styles/base.css`, so the reader rules themselves
 * are theme-agnostic.
 */
export function ReaderShell({
  children,
  theme,
  className = "",
}: {
  children: ReactNode;
  theme: "paper" | "dark";
  className?: string;
}) {
  return (
    <div className={`app-background reader-background reader-background--${theme}`}>
      <div className={`reader-shell reader-shell--${theme} ${className}`}>{children}</div>
    </div>
  );
}
