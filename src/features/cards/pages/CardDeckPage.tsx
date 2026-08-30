import { useCallback, useMemo, useReducer, type Dispatch } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { DeckOverview } from "@/features/cards/components/DeckOverview";
import { SessionSummary } from "@/features/cards/components/SessionSummary";
import { StudySession } from "@/features/cards/components/StudySession";
import { useCardProgressActions, useCardProgressState } from "@/features/cards/useCardProgress";
import {
  findCardDeck,
  getCardDeckProgress,
  getCardsForDeck,
  getCardsForReviewQueue,
  NEED_TO_REVIEW_DECK_ID,
  type CardDeck,
  type StudyCard,
} from "@/features/cards/cards";
import type { CardResult } from "@/features/cards/cardProgress.types";
import { IDLE, sessionReducer, type SessionEvent, type SessionState } from "@/features/cards/studySession.state";
import type { Lesson } from "@/lib/content";
import { findContent } from "@/lib/content";
import { CardNotFoundPage } from "@/features/cards/pages/CardNotFoundPage";

function CardDeckStudySession({
  lessonTitle,
  session,
  dispatch,
  isReviewQueue = false,
}: {
  lessonTitle: string;
  session: SessionState;
  dispatch: Dispatch<SessionEvent>;
  isReviewQueue?: boolean;
}) {
  const { t } = useTranslation();
  const { markCard, removeCardFromReview } = useCardProgressActions();

  const handleAnswer = useCallback(
    (result: CardResult) => {
      const card = session.cards?.[session.index];
      if (!card) return;
      markCard(card.id, result);
      if (isReviewQueue && result === "remembered") removeCardFromReview(card.id);
      dispatch({ type: "answer", result, card });
    },
    [dispatch, isReviewQueue, markCard, removeCardFromReview, session.cards, session.index],
  );

  if (!session.cards) return null;

  return (
    <AppShell title={t("cards.title")} showBack right={<span />} className="card-session-shell">
      <StudySession
        lessonTitle={lessonTitle}
        card={session.cards[session.index]}
        index={session.index}
        total={session.cards.length}
        revealed={session.revealed}
        onReveal={() => dispatch({ type: "reveal" })}
        onAnswer={handleAnswer}
        onLeave={() => dispatch({ type: "leave" })}
      />
    </AppShell>
  );
}

function CardReviewQueuePage({ session, dispatch }: { session: SessionState; dispatch: Dispatch<SessionEvent> }) {
  const { t } = useTranslation();
  const progress = useCardProgressState();
  const reviewCards = useMemo(() => getCardsForReviewQueue(progress.needToReview), [progress.needToReview]);

  const startSession = useCallback(
    (selected?: StudyCard[]) => {
      const source = selected ?? reviewCards;
      if (source.length) dispatch({ type: "start", cards: source });
    },
    [dispatch, reviewCards],
  );

  if (!reviewCards.length && !session.cards && !session.summaryVisible) {
    return <Navigate to="/cards" replace />;
  }

  if (session.cards) {
    return (
      <CardDeckStudySession
        lessonTitle={t("cards.needReviewDeckTitle")}
        session={session}
        dispatch={dispatch}
        isReviewQueue
      />
    );
  }

  if (session.summaryVisible) {
    return (
      <AppShell title={t("cards.title")} showBack right={<span />} className="card-deck-shell">
        <SessionSummary
          remembered={session.remembered}
          repeat={session.repeat}
          onRepeatDifficult={session.repeat > 0 ? () => startSession(session.lastDifficult) : undefined}
        />
      </AppShell>
    );
  }

  const queueProgress = {
    total: reviewCards.length,
    known: 0,
    learning: reviewCards.length,
    newCount: 0,
    percent: 0,
  };

  return (
    <AppShell title={t("cards.title")} showBack right={<span />} className="card-deck-shell">
      <DeckOverview
        title={t("cards.needReviewDeckTitle")}
        subtitle={t("cards.needReviewDescription")}
        sourceLabel={t("cards.needReviewSource")}
        progress={queueProgress}
        onStartAdaptive={() => startSession()}
        primaryLabel={t("cards.reviewQueueStart")}
      />
    </AppShell>
  );
}

function CardDeckIdleView({
  deck,
  lesson,
  deckCards,
  session,
  dispatch,
}: {
  deck: CardDeck;
  lesson: Lesson;
  deckCards: StudyCard[];
  session: SessionState;
  dispatch: Dispatch<SessionEvent>;
}) {
  const { t } = useTranslation();
  const progress = useCardProgressState();
  const { getCardStatus } = useCardProgressActions();
  const deckProgress = useMemo(() => getCardDeckProgress(deck.id, progress), [deck.id, progress]);

  const startSession = useCallback(
    (mode: "adaptive" | "all", selected?: StudyCard[]) => {
      const source =
        selected ?? (mode === "all" ? deckCards : deckCards.filter((card) => getCardStatus(card.id) !== "known"));
      // Nothing left to learn: fall back to the whole deck rather than an empty session.
      dispatch({ type: "start", cards: source.length ? source : deckCards });
    },
    [deckCards, dispatch, getCardStatus],
  );

  if (session.summaryVisible) {
    return (
      <AppShell title={t("cards.title")} showBack right={<span />} className="card-deck-shell">
        <SessionSummary
          remembered={session.remembered}
          repeat={session.repeat}
          onRepeatDifficult={
            session.repeat > 0 ? () => startSession("adaptive", session.lastDifficult) : undefined
          }
        />
      </AppShell>
    );
  }

  const sourceLabel = t("cards.lessonDeckSource", { level: lesson.level });
  const hasAdaptiveCards = deckProgress.newCount + deckProgress.learning > 0;

  return (
    <AppShell title={t("cards.title")} showBack right={<span />} className="card-deck-shell">
      <DeckOverview
        title={lesson.title}
        subtitle={lesson.subtitle}
        sourceLabel={sourceLabel}
        progress={deckProgress}
        onStartAdaptive={() => startSession("adaptive")}
        onStartAll={hasAdaptiveCards ? () => startSession("all") : undefined}
      />
    </AppShell>
  );
}

/**
 * Keyed by `deckId` so the session reducer starts fresh for each deck: React
 * reuses this component when only the route param changes, which would
 * otherwise carry one deck's summary and counters over to the next.
 */
export function CardDeckPage() {
  const { deckId = "" } = useParams();
  return <CardDeckRoute key={deckId} deckId={deckId} />;
}

function CardDeckRoute({ deckId }: { deckId: string }) {
  const [session, dispatch] = useReducer(sessionReducer, IDLE);
  const deck = findCardDeck(deckId);
  const lesson = deck ? findContent("lesson", deck.lessonId) : undefined;

  const deckCards = useMemo(() => (deck ? getCardsForDeck(deck.id) : []), [deck]);

  if (deckId === NEED_TO_REVIEW_DECK_ID) {
    return <CardReviewQueuePage session={session} dispatch={dispatch} />;
  }

  if (!deck || !lesson) return <CardNotFoundPage />;

  if (session.cards) {
    return <CardDeckStudySession lessonTitle={lesson.title} session={session} dispatch={dispatch} />;
  }

  return <CardDeckIdleView deck={deck} lesson={lesson} deckCards={deckCards} session={session} dispatch={dispatch} />;
}
