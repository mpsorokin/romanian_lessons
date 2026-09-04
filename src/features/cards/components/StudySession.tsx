import { ArrowCounterClockwise, ArrowLeft, Check } from "@phosphor-icons/react";
import { useState } from "react";
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
  sourceLabel,
  rememberedLabel,
  repeatLabel,
}: {
  lessonTitle: string;
  card: StudyCard;
  index: number;
  total: number;
  revealed: boolean;
  onReveal: () => void;
  onAnswer: (result: CardResult) => void;
  onLeave: () => void;
  sourceLabel?: string;
  rememberedLabel?: string;
  repeatLabel?: string;
}) {
  const { t } = useTranslation();
  // Track which card was answered rather than a boolean the next card has to
  // reset: a new card clears the disabled state without an extra render pass.
  const [answeredKey, setAnsweredKey] = useState<string | null>(null);
  const answerKey = `${card.id}:${index}`;
  const answered = answeredKey === answerKey;

  return (
    <>
      <div className="card-session-top">
        <div>
          <p className="eyebrow">{lessonTitle}</p>
          {sourceLabel && <small className="card-session-top__source">{sourceLabel}</small>}
          <span>{t("cards.cardProgress", { current: index + 1, total })}</span>
        </div>
        <ProgressBar value={(index + (revealed ? 1 : 0)) / total} label={t("cards.sessionProgress")} />
      </div>
      <section className={`study-card ${revealed ? "study-card--revealed" : ""}`}>
        <p className="eyebrow">{t("cards.translatePrompt")}</p>
        <h1>{card.promptRu}</h1>
        {!revealed ? (
          <button className="primary-button" type="button" onClick={onReveal}>
            {t("cards.showAnswer")}
          </button>
        ) : (
          <>
            <div className="study-card__answer" aria-live="polite">
              <strong>{card.answerRo}</strong>
              <span>{card.pronunciation}</span>
              {card.noun && (
                <dl className="study-card__noun">
                  <div>
                    <dt>{t("cards.gender")}</dt>
                    <dd>{t(`cards.genderValues.${card.noun.gender}`)}</dd>
                  </div>
                  <div>
                    <dt>{t("cards.plural")}</dt>
                    <dd>{card.noun.plural}</dd>
                  </div>
                  <div>
                    <dt>{t("cards.pluralPronunciation")}</dt>
                    <dd>{card.noun.pluralPronunciation}</dd>
                  </div>
                </dl>
              )}
            </div>
            <div className="study-card__actions">
              <button className="secondary-button" type="button" disabled={answered} onClick={() => { setAnsweredKey(answerKey); onAnswer("repeat"); }}>
                <ArrowCounterClockwise size={17} aria-hidden="true" /> {repeatLabel ?? t("cards.needReview")}
              </button>
              <button className="primary-button" type="button" disabled={answered} onClick={() => { setAnsweredKey(answerKey); onAnswer("remembered"); }}>
                <Check size={17} weight="bold" aria-hidden="true" /> {rememberedLabel ?? t("cards.remembered")}
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
