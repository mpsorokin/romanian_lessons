import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";

/** Either a link somewhere useful, or an in-place recovery button. */
export type NotFoundAction = { label: string; to: string } | { label: string; onClick: () => void };

interface NotFoundProps {
  title: string;
  description: ReactNode;
  action: NotFoundAction;
  eyebrow?: string;
  /** Optional mark above the eyebrow, used by the cards area. */
  icon?: ReactNode;
  /** Extra technical text below the action; the error boundary shows the message here. */
  detail?: ReactNode;
}

/**
 * The single empty/missing/crashed state. Four screens rendered this markup by
 * hand before, which is why the copy is entirely prop-driven.
 */
export function NotFound({ title, description, action, eyebrow, icon, detail }: NotFoundProps) {
  const { t } = useTranslation();

  return (
    <AppShell className="not-found-shell">
      <div className="not-found">
        {icon}
        <p className="eyebrow">{eyebrow ?? t("common.error")}</p>
        <h2>{title}</h2>
        <p>{description}</p>
        {"to" in action ? (
          <Link className="primary-button" to={action.to}>
            {action.label}
          </Link>
        ) : (
          <button className="primary-button" type="button" onClick={action.onClick}>
            {action.label}
          </button>
        )}
        {detail}
      </div>
    </AppShell>
  );
}
