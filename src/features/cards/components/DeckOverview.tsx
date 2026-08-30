import { ArrowLeft } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ProgressRing } from "@/components/ui/ProgressRing";
import type { CardDeckProgress } from "@/features/cards/cards";

/** The deck landing screen: how far along the deck is, and how to start. */
export function DeckOverview({
  title,
  subtitle,
  sourceLabel,
  progress,
  onStartAdaptive,
  onStartAll,
  primaryLabel,
}: {
  title: string;
  subtitle?: string;
  sourceLabel: string;
  progress: CardDeckProgress;
  onStartAdaptive: () => void;
  /** Absent once nothing is left to learn — then the adaptive button replays the deck. */
  onStartAll?: () => void;
  /** Overrides the default action label for special deck-like flows. */
  primaryLabel?: string;
}) {
  const { t } = useTranslation();

  return (
    <>
      <Link className="card-deck-back" to="/cards">
        <ArrowLeft size={16} /> {t("cards.allDecks")}
      </Link>
      <section className="card-deck-hero">
        <p className="eyebrow">{sourceLabel}</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <div className="card-deck-hero__progress">
          <ProgressRing value={progress.percent} label={t("cards.percentMastered", { percent: Math.round(progress.percent * 100) })} />
          <div>
            <strong>{t("cards.masteredCount", { known: progress.known, total: progress.total })}</strong>
            <span>{t("cards.mastered")}</span>
            <ProgressBar value={progress.percent} />
          </div>
        </div>
      </section>
      <div className="card-deck-actions">
        <button className="primary-button" type="button" onClick={onStartAdaptive}>
          {primaryLabel ?? (onStartAll ? t("cards.continue") : t("cards.reviewDeck"))}
        </button>
        {onStartAll && (
          <button className="secondary-button" type="button" onClick={onStartAll}>
            {t("cards.reviewAll")}
          </button>
        )}
      </div>
      <div className="card-deck-breakdown">
        <span>{t("cards.newCount", { count: progress.newCount })}</span>
        <span>{t("cards.learningCount", { count: progress.learning })}</span>
        <span>{t("cards.masteredCountShort", { count: progress.known })}</span>
      </div>
    </>
  );
}
