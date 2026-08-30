import { memo } from "react";
import { ArrowRight, CardsThree } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { NEED_TO_REVIEW_DECK_ID } from "@/features/cards/cards";

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

export const CardReviewQueueRow = memo(function CardReviewQueueRow({ count }: { count: number }) {
  const { t } = useTranslation();

  return (
    <Link
      className="card-deck-row card-deck-row--review-queue"
      to={`/cards/${NEED_TO_REVIEW_DECK_ID}`}
      aria-label={t("cards.reviewQueueCount", { count })}
    >
      <span className="card-deck-row__marker" aria-hidden="true">
        <CardsThree size={18} />
      </span>
      <span className="card-deck-row__main">
        <strong>{t("cards.needReviewDeckTitle")}</strong>
        <small>{t("cards.needReviewSource")}</small>
      </span>
      <span className="card-deck-row__meta">
        <b>{count}</b>
        <small>{t("cards.reviewQueueStatus")}</small>
      </span>
      <ArrowRight size={18} aria-hidden="true" />
    </Link>
  );
});
