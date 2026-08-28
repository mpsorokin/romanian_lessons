import { ArrowRight, CardsThree } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { DarkShell } from "../components/PageShell";
import { ProgressBar } from "../components/ProgressBar";
import { useCardProgressState } from "../features/cards/useCardProgress";
import { cardDecks, getCardDeckProgress } from "../lib/cards";
import { findContent } from "../lib/content";

export function CardsPage() {
  const progress = useCardProgressState();

  return (
    <DarkShell title="Карточки" showBack className="cards-shell">
      <div className="cards-intro">
        <p className="eyebrow">АКТИВНОЕ ВОСПОИЗВЕДЕНИЕ</p>
        <p>Вспоминайте русскую подсказку по-румынски и отмечайте фразы, которые уже закрепились.</p>
      </div>
      <div className="cards-list" aria-label="Колоды карточек">
        {cardDecks.map((deck) => {
          const lesson = findContent("lesson", deck.lessonId);
          if (!lesson) return null;
          const summary = getCardDeckProgress(deck.id, progress);
          const sourceLessons = deck.sourceLessonIds.map((id) => findContent("lesson", id)).filter(Boolean);
          const sourceLabel = deck.kind === "recall"
            ? `Повторение · уроки ${sourceLessons.map((item) => item?.order).join("–")}`
            : lesson.subtitle ?? "Карточки урока";
          return (
            <Link key={deck.id} className="card-deck-row" to={`/cards/${deck.id}`}>
              <span className="card-deck-row__order">{String(lesson.order).padStart(2, "0")}</span>
              <span className="card-deck-row__main">
                <strong>{lesson.title}</strong>
                <small>{lesson.level} · {sourceLabel}</small>
                <ProgressBar value={summary.percent} label={`${summary.known} из ${summary.total} карточек закреплено`} />
              </span>
              <span className="card-deck-row__meta">
                <b>{summary.known}/{summary.total}</b>
                <small>{summary.percent === 1 ? "Закреплено" : summary.learning ? `${summary.learning} на повторении` : "Новая"}</small>
              </span>
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </DarkShell>
  );
}

export function CardNotFoundPage() {
  return (
    <DarkShell className="not-found-shell">
      <div className="not-found">
        <CardsThree size={32} aria-hidden="true" />
        <p className="eyebrow">КАРТОЧКИ</p>
        <h2>Колода не найдена</h2>
        <p>Вернитесь к списку колод и выберите другой урок.</p>
        <Link className="primary-button" to="/cards">К колодам</Link>
      </div>
    </DarkShell>
  );
}
