import { ArrowLeft } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

export function BackButton({ to, label = "Назад" }: { to: string; label?: string }) {
  return (
    <Link className="icon-button reader-back" to={to} aria-label={label}>
      <ArrowLeft size={21} aria-hidden="true" />
    </Link>
  );
}
