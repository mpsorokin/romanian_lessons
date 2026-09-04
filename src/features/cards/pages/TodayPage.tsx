import { ArrowRight, CalendarCheck, Check, Clock, Sparkle } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { TFunction } from "i18next";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/layout/AppShell";
import { StudySession } from "@/features/cards/components/StudySession";
import { useCardProgressActions, useCardProgressState } from "@/features/cards/useCardProgress";
import { findStudyCard, getCardsForReviewQueue, getTodayQueue } from "@/features/cards/cards";
import { applyReview, dateKey, TODAY_LIMIT } from "@/features/cards/scheduler";
import type { CardResult, TodaySessionState } from "@/features/cards/cardProgress.types";
import { findContent } from "@/lib/content";
import { useNextReviewDate, useTodayDateKey, useTodayQueue } from "@/features/cards/useTodayQueue";
import { CARD_MIGRATION_NOTICE_STORAGE_KEY } from "@/features/cards/cardProgress.v2.storage";

/** The persisted session plus the one field that only matters while studying. */
type TodayRuntime = Omit<TodaySessionState, "id"> & { completed: boolean };

type TodayEvent =
  | { type: "reveal" }
  | { type: "answer"; result: CardResult; cardId: string; wasNew: boolean; wasRetry: boolean };

function runtimeFromSession({ id: _id, ...session }: TodaySessionState): TodayRuntime {
  return { ...session, completed: false };
}

function runtimeToSession({ completed: _completed, ...state }: TodayRuntime): TodaySessionState {
  return { id: `today-${state.cardIds.join(",")}`, ...state };
}

function createRuntime(cardIds: string[] = [], primaryTotal = 0): TodayRuntime {
  return {
    cardIds,
    index: 0,
    revealed: false,
    retryCounts: {},
    remembered: 0,
    repeat: 0,
    errors: 0,
    newCount: 0,
    firstRecallCount: 0,
    retryCount: 0,
    difficult: [],
    primaryTotal,
    startedAt: new Date().toISOString(),
    completed: false,
  };
}

function todayReducer(state: TodayRuntime, event: TodayEvent): TodayRuntime {
  if (event.type === "reveal") return { ...state, revealed: true };
  if (state.completed) return state;

  const retryCounts = { ...state.retryCounts };
  const retryCount = retryCounts[event.cardId] ?? 0;
  const nextRemembered = state.remembered + (event.result === "remembered" ? 1 : 0);
  const nextRepeat = state.repeat + (event.result === "repeat" ? 1 : 0);
  const nextErrors = state.errors + (event.result === "repeat" && !event.wasRetry ? 1 : 0);
  let cardIds = state.cardIds;
  let nextRetryCounts = retryCounts;
  if (event.result === "repeat" && retryCount < 1) {
    nextRetryCounts = { ...retryCounts, [event.cardId]: retryCount + 1 };
    const insertAt = Math.min(state.cardIds.length, state.index + 4);
    cardIds = [...state.cardIds.slice(0, insertAt), event.cardId, ...state.cardIds.slice(insertAt)];
  }

  const nextIndex = state.index + 1;
  const completed = nextIndex >= cardIds.length;
  return {
    ...state,
    cardIds,
    index: nextIndex,
    revealed: false,
    retryCounts: nextRetryCounts,
    remembered: nextRemembered,
    repeat: nextRepeat,
    errors: nextErrors,
    newCount: state.newCount + (event.wasNew ? 1 : 0),
    firstRecallCount: state.firstRecallCount + (!event.wasNew && !event.wasRetry && event.result === "remembered" ? 1 : 0),
    retryCount: state.retryCount + (event.wasRetry ? 1 : 0),
    difficult: event.result === "repeat" && !state.difficult.includes(event.cardId) ? [...state.difficult, event.cardId] : state.difficult,
    completed,
  };
}

function dateLabel(date: string, locale: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  return new Intl.DateTimeFormat(locale.startsWith("ru") ? "ru-RU" : "en-US", { month: "short", day: "numeric" }).format(parsed);
}

function relativeReviewLabel(date: string, now: Date, t: TFunction): string {
  const today = dateKey(now);
  if (date === today) return t("cards.nextReviewTomorrow");
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date === dateKey(tomorrow)) return t("cards.nextReviewTomorrow");
  const days = Math.round((new Date(`${date}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime()) / 86_400_000);
  return t("cards.nextReviewInDays", { count: Math.max(1, days) });
}

function previewLabels(
  cardId: string,
  progress: ReturnType<typeof useCardProgressState>,
  retry: boolean,
  locale: string,
  t: TFunction,
) {
  const current = new Date();
  const record = progress.cards[cardId];
  const remembered = applyReview(record, "remembered", current, "today", retry).record;
  const repeat = applyReview(record, "repeat", current, "today", retry).record;
  return {
    remembered: `${t("cards.remembered")} · ${relativeReviewLabel(remembered.dueDate, current, t)} (${dateLabel(remembered.dueDate, locale)})`,
    repeat: `${t("cards.repeatAnswer")} · ${relativeReviewLabel(repeat.dueDate, current, t)} (${dateLabel(repeat.dueDate, locale)})`,
  };
}

function TodayOverview({ onStart, dueCount, newCount, remainingDue, hasQueue, hasStartedDecks, hasActiveSession, nextReview }: { onStart: () => void; dueCount: number; newCount: number; remainingDue: number; hasQueue: boolean; hasStartedDecks: boolean; hasActiveSession: boolean; nextReview: string | null }) {
  const { t, i18n } = useTranslation();
  return (
    <>
      <section className="today-hero">
        <div className="today-hero__icon"><CalendarCheck size={24} /></div>
        <p className="eyebrow">{t("cards.todayEyebrow")}</p>
        <h1>{t("cards.today")}</h1>
        <p>{t("cards.todayDescription")}</p>
        <div className="today-hero__stats">
          <span><Clock size={15} /> {t("cards.todayDueCount", { count: dueCount })}</span>
          <span><Sparkle size={15} /> {t("cards.todayNewCount", { count: newCount })}</span>
        </div>
      </section>
      {hasQueue ? (
        <button className="primary-button" type="button" onClick={onStart}>{t(hasActiveSession ? "cards.todayContinue" : "cards.todayStart")}</button>
      ) : (
        <div className="today-empty">
          <strong>{t("cards.todayEmpty")}</strong>
          <p>{t(hasStartedDecks ? "cards.todayEmptyStartedDescription" : "cards.todayEmptyDescription")}</p>
          {nextReview && <p className="today-next-review">{t("cards.todayNextReview", { date: dateLabel(nextReview, i18n.language) })}</p>}
          {!hasStartedDecks && <Link className="outline-button" to="/cards/lesson-01">{t("cards.toDecks")} <ArrowRight size={15} /></Link>}
        </div>
      )}
      {remainingDue > 0 && <p className="today-remaining">{t("cards.todayRemaining", { count: remainingDue })}</p>}
    </>
  );
}

function TodaySessionView({ state, onStateChange, remainingDue, nextReview, onStartExtra }: { state: TodayRuntime; onStateChange: (state: TodayRuntime) => void; remainingDue: number; nextReview: string | null; onStartExtra: () => void }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const progress = useCardProgressState();
  const { markCard, saveTodaySession } = useCardProgressActions();
  const card = findStudyCard(state.cardIds[state.index]);
  const primaryTotal = state.primaryTotal || new Set(state.cardIds).size;
  const seenBefore = useMemo(() => new Set(state.cardIds.slice(0, state.index)), [state.cardIds, state.index]);
  const primaryPosition = card ? Math.min(primaryTotal, seenBefore.size + (seenBefore.has(card.id) ? 0 : 1)) : primaryTotal;
  const isRetry = card ? (state.retryCounts[card.id] ?? 0) > 0 : false;

  const handleAnswer = useCallback((result: CardResult) => {
    if (!card) return;
    const wasRetry = (state.retryCounts[card.id] ?? 0) > 0;
    const wasNew = !progress.cards[card.id];
    const next = todayReducer(state, { type: "answer", result, cardId: card.id, wasNew, wasRetry });
    markCard(card.id, result, { mode: "today", retry: wasRetry, attemptKey: `today:${state.startedAt}:${state.index}`, session: next.completed ? null : runtimeToSession(next) });
    onStateChange(next);
  }, [card, markCard, onStateChange, progress.cards, state]);

  // Both buttons preview their next due date, which means running the scheduler
  // twice; keep that off every unrelated re-render of the session. The day key is
  // a dependency because the previewed dates are relative to today.
  const today = useTodayDateKey();
  const labels = useMemo(
    () => (card ? previewLabels(card.id, progress, isRetry, i18n.language, t) : null),
    [card, i18n.language, isRetry, progress, t, today],
  );

  if (!card || !labels || state.completed) return <TodaySummary state={state} remainingDue={remainingDue} nextReview={nextReview} onStartExtra={onStartExtra} />;
  const lesson = findContent("lesson", card.lessonId);
  const source = t("cards.todaySource", { order: String(lesson?.order ?? card.order).padStart(2, "0"), title: lesson?.title ?? card.lessonId });
  return (
    <>
      <div className="today-session-label">
        <span>{t("cards.cardProgress", { current: primaryPosition, total: primaryTotal })}</span>
        <span>{state.newCount} {t("cards.newCount", { count: state.newCount })} · {state.retryCount} {t("cards.todayRetries")}{seenBefore.has(card.id) && ` · ${t("cards.todayRetryDisplay")}`}</span>
      </div>
      <StudySession
        lessonTitle={t("cards.today")}
        sourceLabel={source}
        card={card}
        index={Math.max(0, primaryPosition - 1)}
        total={primaryTotal}
        revealed={state.revealed}
        onReveal={() => { const next = todayReducer(state, { type: "reveal" }); saveTodaySession(runtimeToSession(next)); onStateChange(next); }}
        onAnswer={handleAnswer}
        onLeave={() => { saveTodaySession(runtimeToSession(state)); navigate("/cards"); }}
        rememberedLabel={labels.remembered}
        repeatLabel={labels.repeat}
      />
    </>
  );
}

function TodaySummary({ state, remainingDue, nextReview, onStartExtra }: { state: TodayRuntime; remainingDue: number; nextReview: string | null; onStartExtra: () => void }) {
  const { t, i18n } = useTranslation();
  return (
    <section className="today-summary">
      <Check size={30} weight="bold" />
      <p className="eyebrow">{t("cards.todayCompleted")}</p>
      <h1>{t("cards.goodJob")}</h1>
      <div className="today-summary__stats">
        <div><strong>{state.newCount}</strong><span>{t("cards.todayNewAnswered")}</span></div>
        <div><strong>{state.firstRecallCount}</strong><span>{t("cards.todayFirstRecall")}</span></div>
        <div><strong>{state.errors}</strong><span>{t("cards.todayErrors")}</span></div>
      </div>
      <p>{state.retryCount} {t("cards.todayRetries")}</p>
      {remainingDue > 0 && <p className="today-summary__remaining">{t("cards.todayRemaining", { count: remainingDue })}</p>}
      {remainingDue > 0 && <button className="secondary-button" type="button" onClick={onStartExtra}>{t("cards.todayExtraStart")}</button>}
      {remainingDue === 0 && <p className="today-summary__remaining">{nextReview ? t("cards.todayNextReview", { date: dateLabel(nextReview, i18n.language) }) : t("cards.todayNoNextReview")}</p>}
      <Link className="secondary-button" to="/cards">{t("cards.backToDecks")} <ArrowRight size={17} /></Link>
    </section>
  );
}

export function TodayPage() {
  const { t } = useTranslation();
  const progress = useCardProgressState();
  const { saveTodaySession } = useCardProgressActions();
  const queue = useTodayQueue(progress);
  const nextReview = useNextReviewDate(progress);
  const active = progress.activeSession;
  const [showLegacyNotice] = useState(() => {
    if (!progress.migratedLegacy) return false;
    try {
      if (window.localStorage.getItem(CARD_MIGRATION_NOTICE_STORAGE_KEY) === "1") return false;
      window.localStorage.setItem(CARD_MIGRATION_NOTICE_STORAGE_KEY, "1");
    } catch {
      // The notice is helpful but must never block study.
    }
    return true;
  });
  const initial = active ? runtimeFromSession(active) : createRuntime();
  const [state, setState] = useState<TodayRuntime>(initial);
  useEffect(() => {
    if (active) {
      const sameSession = state.cardIds.join(",") === active.cardIds.join(",") && state.index === active.index && state.revealed === active.revealed;
      if (!sameSession) setState(runtimeFromSession(active));
    } else if (state.cardIds.length > 0 && !state.completed) {
      setState(createRuntime());
    }
  }, [active, state.cardIds, state.completed, state.index, state.revealed]);
  const hasSession = state.cardIds.length > 0 && !state.completed;
  const startWith = (cardIds: string[], primaryTotal: number, base: TodayRuntime = createRuntime()) => {
    const next = { ...base, cardIds, primaryTotal };
    saveTodaySession(runtimeToSession(next));
    setState(next);
  };
  const start = () => {
    const cards = queue.cards.map((card) => card.id);
    startWith(cards, cards.length, initial);
  };
  const startExtra = () => {
    // Extra practice reuses today's due cards only; no new card is introduced.
    const cards = getTodayQueue(progress, new Date(), TODAY_LIMIT, 0).cards.map((card) => card.id);
    if (cards.length) startWith(cards, 0);
  };
  const shownQueue = active ? getCardsForReviewQueue(active.cardIds) : queue.cards;
  const dueCount = queue.dueCount;
  const newCount = queue.newCount;
  return (
    <AppShell title={t("cards.title")} showBack right={<span />} className="today-shell">
      {state.completed ? (
        <TodaySummary state={state} remainingDue={queue.remainingDue} nextReview={nextReview} onStartExtra={startExtra} />
      ) : hasSession ? (
        <TodaySessionView state={state} onStateChange={setState} remainingDue={queue.remainingDue} nextReview={nextReview} onStartExtra={startExtra} />
      ) : (
        <TodayOverview onStart={start} dueCount={dueCount} newCount={newCount} remainingDue={queue.remainingDue} hasQueue={queue.cards.length > 0 || shownQueue.length > 0} hasStartedDecks={progress.startedDeckIds.length > 0} hasActiveSession={Boolean(active)} nextReview={nextReview} />
      )}
      {!hasSession && showLegacyNotice && <p className="legacy-progress-notice">{t("cards.legacyProgressNotice")}</p>}
    </AppShell>
  );
}
