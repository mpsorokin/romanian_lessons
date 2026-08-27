import { ArrowLeft, Gear } from "@phosphor-icons/react";
import { Link, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function DarkShell({
  children,
  title,
  wide = false,
  showBack = false,
  right,
  className = "",
}: {
  children: ReactNode;
  title?: string;
  wide?: boolean;
  showBack?: boolean;
  right?: ReactNode;
  className?: string;
}) {
  const navigate = useNavigate();
  return (
    <div className="app-background app-background--dark">
      <div className={`app-shell app-shell--dark ${wide ? "app-shell--wide" : ""} ${className}`}>
        <header className={`app-header ${title && showBack ? "app-header--titled" : ""}`}>
          {showBack ? (
            <button className="icon-button" type="button" aria-label="Назад" onClick={() => navigate(-1)}>
              <ArrowLeft size={21} aria-hidden="true" />
            </button>
          ) : (
            <Link to="/" className="brand-mark">
              Calea
            </Link>
          )}
          {title && showBack && <h1>{title}</h1>}
          {right ?? (!title && <Link className="icon-button" to="/settings" aria-label="Настройки"><Gear size={21} /></Link>)}
        </header>
        <main className="shell-main">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}

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

export function BackButton({ to = -1, label = "Назад" }: { to?: string | number; label?: string }) {
  const navigate = useNavigate();
  return (
    <button
      className="icon-button reader-back"
      type="button"
      aria-label={label}
      onClick={() => (typeof to === "number" ? navigate(to) : navigate(to))}
    >
      <ArrowLeft size={21} aria-hidden="true" />
    </button>
  );
}
