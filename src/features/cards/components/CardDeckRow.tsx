import { memo } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ProgressBar } from "@/components/ui/ProgressBar";

// Primitive props on purpose, like the lesson and story rows: passing the deck
// and the summary as objects would rebuild them every render and defeat `memo`.
export const CardDeckRow = memo(function CardDeckRow({
  deckId,
  order,
  title,
  level,
  sourceLabel,
  known,
  total,
  learning,
  percent,
}: {
  deckId: string;
  order: number;
  title: string;
  level?: string;
  sourceLabel: string;
  known: number;
  total: number;
  learning: number;
  percent: number;
}) {
  const { t } = useTranslation();
  const status =
    percent === 1
      ? t("cards.deckMastered")
      : learning
        ? t("cards.deckLearning", { count: learning })
        : t("cards.deckNew");

  return (
    <Link className="card-deck-row" to={`/cards/${deckId}`}>
      <span className="card-deck-row__order">{String(order).padStart(2, "0")}</span>
      <span className="card-deck-row__main">
        <strong>{title}</strong>
        <small>
          {level} · {sourceLabel}
        </small>
        <ProgressBar value={percent} label={t("cards.deckProgress", { known, total })} />
      </span>
      <span className="card-deck-row__meta">
        <b>
          {known}/{total}
        </b>
        <small>{status}</small>
      </span>
      <ArrowRight size={18} aria-hidden="true" />
    </Link>
  );
});
