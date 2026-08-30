import { useCallback, useMemo, useReducer, type Dispatch } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { DeckOverview } from "@/features/cards/components/DeckOverview";
import { SessionSummary } from "@/features/cards/components/SessionSummary";
import { StudySession } from "@/features/cards/components/StudySession";
import { useCardProgressActions, useCardProgressState } from "@/features/cards/useCardProgress";
import { findCardDeck, getCardDeckProgress, getCardsForDeck, type CardDeck, type StudyCard } from "@/features/cards/cards";
import type { CardResult } from "@/features/cards/cardProgress.types";
import type { Lesson } from "@/lib/content";
import { findContent } from "@/lib/content";
import { CardNotFoundPage } from "@/features/cards/pages/CardNotFoundPage";

interface SessionState {
  /** `null` means no session is running — the deck overview or summary shows instead. */
  cards: StudyCard[] | null;
  index: number;
  revealed: boolean;
  remembered: number;
  repeat: number;
  /** Cards graded "repeat" so far in the running session. */
  difficult: StudyCard[];
  /** Difficult cards of the session being summarised; feeds "Повторить сложные". */
  lastDifficult: StudyCard[];
  summaryVisible: boolean;
}

type SessionEvent =
  | { type: "start"; cards: StudyCard[] }
  | { type: "reveal" }
  | { type: "answer"; result: CardResult; card: StudyCard }
  | { type: "leave" };

const IDLE: SessionState = {
  cards: null,
  index: 0,
  revealed: false,
  remembered: 0,
  repeat: 0,
  difficult: [],
  lastDifficult: [],
  summaryVisible: false,
};

/**
 * One reducer rather than seven `useState`s: answering a card has to move the
 * index, the counters, the difficult list and the reveal flag together, and
 * keeping those in separate setters is what let the previous "finish" and
 * "leave" paths drift apart.
 */
function sessionReducer(state: SessionState, event: SessionEvent): SessionState {
  switch (event.type) {
    case "start":
      return { ...IDLE, lastDifficult: state.lastDifficult, cards: event.cards };

    case "reveal":
      return { ...state, revealed: true };

    case "answer": {
      if (!state.cards) return state;
      const remembered = state.remembered + (event.result === "remembered" ? 1 : 0);
      const repeat = state.repeat + (event.result === "repeat" ? 1 : 0);
      const difficult = event.result === "repeat" ? [...state.difficult, event.card] : state.difficult;
      if (state.index >= state.cards.length - 1) {
        return { ...state, cards: null, remembered, repeat, difficult: [], lastDifficult: difficult, summaryVisible: true };
      }
      return { ...state, index: state.index + 1, revealed: false, remembered, repeat, difficult };
    }

    case "leave":
      return IDLE;
  }
}

function CardDeckStudySession({
  lessonTitle,
  session,
  dispatch,
}: {
  lessonTitle: string;
  session: SessionState;
  dispatch: Dispatch<SessionEvent>;
}) {
  const { t } = useTranslation();
  const { markCard } = useCardProgressActions();

  const handleAnswer = useCallback(
    (result: CardResult) => {
      const card = session.cards?.[session.index];
      if (!card) return;
      markCard(card.id, result);
      dispatch({ type: "answer", result, card });
    },
    [dispatch, markCard, session.cards, session.index],
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
  const deckProgress = getCardDeckProgress(deck.id, progress);

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

export function CardDeckPage() {
  const { deckId = "" } = useParams();
  const deck = findCardDeck(deckId);
  const lesson = deck ? findContent("lesson", deck.lessonId) : undefined;
  const [session, dispatch] = useReducer(sessionReducer, IDLE);

  const deckCards = useMemo(() => (deck ? getCardsForDeck(deck.id) : []), [deck]);

  if (!deck || !lesson) return <CardNotFoundPage />;

  if (session.cards) {
    return <CardDeckStudySession lessonTitle={lesson.title} session={session} dispatch={dispatch} />;
  }

  return <CardDeckIdleView deck={deck} lesson={lesson} deckCards={deckCards} session={session} dispatch={dispatch} />;
}
