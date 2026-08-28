import { ArrowLeft, Gear } from "@phosphor-icons/react";
import { Link, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { BottomNav } from "@/components/layout/BottomNav";

/** The standard dark screen: header, scrolling body and the bottom navigation. */
export function AppShell({
  children,
  title,
  wide = false,
  showBack = false,
  right,
  className = "",
}: {
  children: ReactNode;
  /** Rendered in the centre column, which only exists next to the back button. */
  title?: string;
  wide?: boolean;
  showBack?: boolean;
  right?: ReactNode;
  className?: string;
}) {
  const navigate = useNavigate();
  const titled = Boolean(title && showBack);

  return (
    <div className="app-background app-background--dark">
      <div className={`app-shell app-shell--dark ${wide ? "app-shell--wide" : ""} ${className}`}>
        <header className={`app-header ${titled ? "app-header--titled" : ""}`}>
          {showBack ? (
            <button className="icon-button" type="button" aria-label="Назад" onClick={() => navigate(-1)}>
              <ArrowLeft size={21} aria-hidden="true" />
            </button>
          ) : (
            <Link to="/" className="brand-mark">
              Calea
            </Link>
          )}
          {titled && <h1>{title}</h1>}
          {right ??
            (showBack ? (
              <span />
            ) : (
              <Link className="icon-button" to="/settings" aria-label="Настройки">
                <Gear size={21} />
              </Link>
            ))}
        </header>
        <main className="shell-main">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
