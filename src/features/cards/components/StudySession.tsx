import { ArrowCounterClockwise, ArrowLeft, Check } from "@phosphor-icons/react";
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
  return (
    <>
      <div className="card-session-top">
        <div>
          <p className="eyebrow">{lessonTitle}</p>
          <span>Карточка {index + 1} из {total}</span>
        </div>
        {/* Revealing counts as progress, so the bar moves before the answer is graded. */}
        <ProgressBar value={(index + (revealed ? 1 : 0)) / total} label="Прогресс сессии" />
      </div>
      <section className={`study-card ${revealed ? "study-card--revealed" : ""}`} aria-live="polite">
        <p className="eyebrow">ПЕРЕВЕДИ НА РУМЫНСКИЙ</p>
        <h1>{card.promptRu}</h1>
        {!revealed ? (
          <button className="primary-button" type="button" onClick={onReveal}>Показать ответ</button>
        ) : (
          <>
            <div className="study-card__answer">
              <strong>{card.answerRo}</strong>
              <span>{card.pronunciation}</span>
              {card.note && <small>{card.note}</small>}
            </div>
            <div className="study-card__actions">
              <button className="secondary-button" type="button" onClick={() => onAnswer("repeat")}>
                <ArrowCounterClockwise size={17} aria-hidden="true" /> Нужно повторить
              </button>
              <button className="primary-button" type="button" onClick={() => onAnswer("remembered")}>
                <Check size={17} weight="bold" aria-hidden="true" /> Вспомнил
              </button>
            </div>
          </>
        )}
      </section>
      <button className="card-session-back" type="button" onClick={onLeave}><ArrowLeft size={16} /> К колоде</button>
    </>
  );
}
