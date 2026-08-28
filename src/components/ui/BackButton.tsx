import { ArrowLeft } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export function BackButton({ to, label }: { to: string; label?: string }) {
  const { t } = useTranslation();
  const ariaLabel = label ?? t("common.back");

  return (
    <Link className="icon-button reader-back" to={to} aria-label={ariaLabel}>
      <ArrowLeft size={21} aria-hidden="true" />
    </Link>
  );
}
