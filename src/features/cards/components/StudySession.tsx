import { ArrowCounterClockwise, ArrowLeft, Check } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { StudyCard } from "@/features/cards/cards";
import type { CardResult } from "@/features/cards/cardProgress.types";

/** One card at a time: prompt, revealed answer, and the two grading actions. */
export function StudySession({
  lessonTitle,
  card,
  index,
  total,
  revealed,
  onReveal,
  onAnswer,
  onLeave,
}: {
  lessonTitle: string;
  card: StudyCard;
  index: number;
  total: number;
  revealed: boolean;
  onReveal: () => void;
  onAnswer: (result: CardResult) => void;
  onLeave: () => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      <div className="card-session-top">
        <div>
          <p className="eyebrow">{lessonTitle}</p>
          <span>{t("cards.cardProgress", { current: index + 1, total })}</span>
        </div>
        <ProgressBar value={(index + (revealed ? 1 : 0)) / total} label={t("cards.sessionProgress")} />
      </div>
      <section className={`study-card ${revealed ? "study-card--revealed" : ""}`} aria-live="polite">
        <p className="eyebrow">{t("cards.translatePrompt")}</p>
        <h1>{card.promptRu}</h1>
        {!revealed ? (
          <button className="primary-button" type="button" onClick={onReveal}>
            {t("cards.showAnswer")}
          </button>
        ) : (
          <>
            <div className="study-card__answer">
              <strong>{card.answerRo}</strong>
              <span>{card.pronunciation}</span>
              {card.note && <small>{card.note}</small>}
            </div>
            <div className="study-card__actions">
              <button className="secondary-button" type="button" onClick={() => onAnswer("repeat")}>
                <ArrowCounterClockwise size={17} aria-hidden="true" /> {t("cards.needReview")}
              </button>
              <button className="primary-button" type="button" onClick={() => onAnswer("remembered")}>
                <Check size={17} weight="bold" aria-hidden="true" /> {t("cards.remembered")}
              </button>
            </div>
          </>
        )}
      </section>
      <button className="card-session-back" type="button" onClick={onLeave}>
        <ArrowLeft size={16} /> {t("cards.backToDeck")}
      </button>
    </>
  );
}
