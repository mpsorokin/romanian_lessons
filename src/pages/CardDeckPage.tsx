import { ArrowCounterClockwise, ArrowLeft, ArrowRight, Check } from "@phosphor-icons/react";
import { useCallback, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DarkShell } from "../components/PageShell";
import { ProgressBar, ProgressRing } from "../components/ProgressBar";
import { useCardProgress, useCardProgressState } from "../features/cards/useCardProgress";
import { findCardDeck, getCardDeckProgress, getCardsForDeck, type StudyCard } from "../lib/cards";
import { findContent } from "../lib/content";
import { CardNotFoundPage } from "./CardsPage";

type SessionMode = "adaptive" | "all";

export function CardDeckPage() {
  const { deckId = "" } = useParams();
  const deck = findCardDeck(deckId);
  const lesson = deck ? findContent("lesson", deck.lessonId) : undefined;
  const progress = useCardProgressState();
  const { markCard } = useCardProgress();
  const [sessionCards, setSessionCards] = useState<StudyCard[] | null>(null);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [sessionStats, setSessionStats] = useState({ remembered: 0, repeat: 0 });
  const [sessionDifficultCards, setSessionDifficultCards] = useState<StudyCard[]>([]);
  const [lastDifficultCards, setLastDifficultCards] = useState<StudyCard[]>([]);
  const [summaryVisible, setSummaryVisible] = useState(false);

  const deckCards = useMemo(() => (deck ? getCardsForDeck(deck.id) : []), [deck]);
  const deckProgress = deck ? getCardDeckProgress(deck.id, progress) : null;

  const startSession = useCallback((mode: SessionMode, selectedCards?: StudyCard[]) => {
    if (!deck) return;
    const source = selectedCards ?? (mode === "all" ? deckCards : deckCards.filter((card) => progress.cards[card.id]?.status !== "known"));
    const cards = source.length ? source : deckCards;
    setSessionCards(cards);
    setSessionIndex(0);
    setRevealed(false);
    setSessionStats({ remembered: 0, repeat: 0 });
    setSessionDifficultCards([]);
    setSummaryVisible(false);
  }, [deck, deckCards, progress.cards]);

  const finishSession = (remembered: number, repeat: number, difficultCards: StudyCard[]) => {
    setSessionStats({ remembered, repeat });
    setLastDifficultCards(difficultCards);
    setSessionCards(null);
    setSummaryVisible(true);
  };

  const leaveSession = useCallback(() => {
    setSessionCards(null);
    setSessionIndex(0);
    setRevealed(false);
    setSessionStats({ remembered: 0, repeat: 0 });
    setSessionDifficultCards([]);
    setLastDifficultCards([]);
    setSummaryVisible(false);
  }, []);

  const handleResult = (result: "remembered" | "repeat") => {
    if (!sessionCards) return;
    const card = sessionCards[sessionIndex];
    markCard(card.id, result);
    const remembered = sessionStats.remembered + (result === "remembered" ? 1 : 0);
    const repeat = sessionStats.repeat + (result === "repeat" ? 1 : 0);
    const difficultCards = result === "repeat" ? [...sessionDifficultCards, card] : sessionDifficultCards;
    if (sessionIndex >= sessionCards.length - 1) finishSession(remembered, repeat, difficultCards);
    else {
      setSessionStats({ remembered, repeat });
      setSessionDifficultCards(difficultCards);
      setSessionIndex((index) => index + 1);
      setRevealed(false);
    }
  };

  if (!deck || !lesson || !deckProgress) return <CardNotFoundPage />;

  if (sessionCards) {
    const card = sessionCards[sessionIndex];
    return (
      <DarkShell title="Карточки" showBack right={<span />} className="card-session-shell">
        <div className="card-session-top">
          <div>
            <p className="eyebrow">{lesson.title}</p>
            <span>Карточка {sessionIndex + 1} из {sessionCards.length}</span>
          </div>
          <ProgressBar value={(sessionIndex + (revealed ? 1 : 0)) / sessionCards.length} label="Прогресс сессии" />
        </div>
        <section className={`study-card ${revealed ? "study-card--revealed" : ""}`} aria-live="polite">
          <p className="eyebrow">ПЕРЕВЕДИ НА РУМЫНСКИЙ</p>
          <h1>{card.promptRu}</h1>
          {!revealed ? (
            <button className="primary-button" type="button" onClick={() => setRevealed(true)}>Показать ответ</button>
          ) : (
            <>
              <div className="study-card__answer">
                <strong>{card.answerRo}</strong>
                <span>{card.pronunciation}</span>
                {card.note && <small>{card.note}</small>}
              </div>
              <div className="study-card__actions">
                <button className="secondary-button" type="button" onClick={() => handleResult("repeat")}>
                  <ArrowCounterClockwise size={17} aria-hidden="true" /> Нужно повторить
                </button>
                <button className="primary-button" type="button" onClick={() => handleResult("remembered")}>
                  <Check size={17} weight="bold" aria-hidden="true" /> Вспомнил
                </button>
              </div>
            </>
          )}
        </section>
        <button className="card-session-back" type="button" onClick={leaveSession}><ArrowLeft size={16} /> К колоде</button>
      </DarkShell>
    );
  }

  if (summaryVisible) {
    return (
      <DarkShell title="Карточки" showBack right={<span />} className="card-deck-shell">
        <section className="card-summary">
          <p className="eyebrow">СЕССИЯ ЗАВЕРШЕНА</p>
          <h1>Хорошая работа</h1>
          <p>Ты отметил знакомыми {sessionStats.remembered} из {sessionStats.remembered + sessionStats.repeat} карточек.</p>
          <div className="card-summary__stats">
            <div><strong>{sessionStats.remembered}</strong><span>вспомнил</span></div>
            <div><strong>{sessionStats.repeat}</strong><span>на повторении</span></div>
          </div>
          {sessionStats.repeat > 0 && <button className="primary-button" type="button" onClick={() => startSession("adaptive", lastDifficultCards)}>Повторить сложные</button>}
          <Link className="secondary-button" to="/cards">К списку колод <ArrowRight size={17} /></Link>
        </section>
      </DarkShell>
    );
  }

  const sourceLessons = deck.sourceLessonIds.map((id) => findContent("lesson", id)).filter(Boolean);
  const sourceLabel = deck.kind === "recall"
    ? `${lesson.level} · Повторение уроков ${sourceLessons.map((item) => item?.order).join("–")}`
    : `${lesson.level} · Русский → румынский`;
  const hasAdaptiveCards = deckProgress.newCount + deckProgress.learning > 0;

  return (
    <DarkShell title="Карточки" showBack right={<span />} className="card-deck-shell">
      <Link className="card-deck-back" to="/cards"><ArrowLeft size={16} /> Все колоды</Link>
      <section className="card-deck-hero">
        <p className="eyebrow">{sourceLabel}</p>
        <h1>{lesson.title}</h1>
        <p>{lesson.subtitle}</p>
        <div className="card-deck-hero__progress">
          <ProgressRing value={deckProgress.percent} label={`${Math.round(deckProgress.percent * 100)}% карточек закреплено`} />
          <div><strong>{deckProgress.known} из {deckProgress.total}</strong><span>закреплено</span><ProgressBar value={deckProgress.percent} /></div>
        </div>
      </section>
      <div className="card-deck-actions">
        <button className="primary-button" type="button" onClick={() => startSession("adaptive")}>
          {hasAdaptiveCards ? "Продолжить" : "Повторить колоду"}
        </button>
        {hasAdaptiveCards && <button className="secondary-button" type="button" onClick={() => startSession("all")}>Повторить всё</button>}
      </div>
      <div className="card-deck-breakdown"><span>{deckProgress.newCount} новых</span><span>{deckProgress.learning} на повторении</span><span>{deckProgress.known} закреплено</span></div>
    </DarkShell>
  );
}
