import { ArrowRight } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

/** Shown once a session runs out of cards. */
export function SessionSummary({
  remembered,
  repeat,
  onRepeatDifficult,
}: {
  remembered: number;
  repeat: number;
  /** Absent when nothing was marked for repetition. */
  onRepeatDifficult?: () => void;
}) {
  return (
    <section className="card-summary">
      <p className="eyebrow">СЕССИЯ ЗАВЕРШЕНА</p>
      <h1>Хорошая работа</h1>
      <p>Ты отметил знакомыми {remembered} из {remembered + repeat} карточек.</p>
      <div className="card-summary__stats">
        <div><strong>{remembered}</strong><span>вспомнил</span></div>
        <div><strong>{repeat}</strong><span>на повторении</span></div>
      </div>
      {onRepeatDifficult && (
        <button className="primary-button" type="button" onClick={onRepeatDifficult}>Повторить сложные</button>
      )}
      <Link className="secondary-button" to="/cards">К списку колод <ArrowRight size={17} /></Link>
    </section>
  );
}
