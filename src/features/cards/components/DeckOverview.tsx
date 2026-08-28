import { ArrowLeft } from "@phosphor-icons/react";
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
}: {
  title: string;
  subtitle?: string;
  sourceLabel: string;
  progress: CardDeckProgress;
  onStartAdaptive: () => void;
  /** Absent once nothing is left to learn — then the adaptive button replays the deck. */
  onStartAll?: () => void;
}) {
  return (
    <>
      <Link className="card-deck-back" to="/cards"><ArrowLeft size={16} /> Все колоды</Link>
      <section className="card-deck-hero">
        <p className="eyebrow">{sourceLabel}</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <div className="card-deck-hero__progress">
          <ProgressRing value={progress.percent} label={`${Math.round(progress.percent * 100)}% карточек закреплено`} />
          <div>
            <strong>{progress.known} из {progress.total}</strong>
            <span>закреплено</span>
            <ProgressBar value={progress.percent} />
          </div>
        </div>
      </section>
      <div className="card-deck-actions">
        <button className="primary-button" type="button" onClick={onStartAdaptive}>
          {onStartAll ? "Продолжить" : "Повторить колоду"}
        </button>
        {onStartAll && <button className="secondary-button" type="button" onClick={onStartAll}>Повторить всё</button>}
      </div>
      <div className="card-deck-breakdown">
        <span>{progress.newCount} новых</span>
        <span>{progress.learning} на повторении</span>
        <span>{progress.known} закреплено</span>
      </div>
    </>
  );
}
