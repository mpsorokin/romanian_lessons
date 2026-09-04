import { ArrowRight, CalendarCheck } from "@phosphor-icons/react";
import { useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CardDeckRow, CardReviewQueueRow } from "@/features/cards/components/CardDeckRow";
import { useCardProgressState } from "@/features/cards/useCardProgress";
import { cardDecks, getCardDeckProgress, getCardsForReviewQueue } from "@/features/cards/cards";
import { findContent } from "@/lib/content";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { getRecallMetric } from "@/features/cards/cardStats";
import { useTodayDateKey, useTodayQueue } from "@/features/cards/useTodayQueue";

export function CardsPage() {
  const { t } = useTranslation();
  const progress = useCardProgressState();
  const todayKey = useTodayDateKey();
  const reviewCount = useMemo(() => getCardsForReviewQueue(progress.needToReview).length, [progress.needToReview]);
  const today = useTodayQueue(progress);
  const recall30 = useMemo(() => getRecallMetric(progress, 24), [progress, todayKey]);
  const recall7 = useMemo(() => getRecallMetric(progress, 7 * 24), [progress, todayKey]);
  const deckRows = useMemo(
    () =>
      cardDecks.flatMap((deck) => {
        const lesson = findContent("lesson", deck.lessonId);
        return lesson ? [{ deck, lesson, summary: getCardDeckProgress(deck.id, progress) }] : [];
      }),
    [progress],
  );

  return (
    <AppShell title={t("cards.title")} className="cards-shell">
      <div className="cards-intro">
        <p className="eyebrow">{t("cards.activeRecallEyebrow")}</p>
        <p>{t("cards.intro")}</p>
      </div>
      <Link className="today-card-link" to="/cards/today">
        <span className="today-card-link__icon"><CalendarCheck size={20} aria-hidden="true" /></span>
        <span><strong>{t("cards.today")}</strong><small>{t("cards.todayDueCount", { count: today.dueCount })} · {t("cards.todayNewCount", { count: today.newCount })}</small></span>
        <span className="today-card-link__action">{progress.activeSession ? t("cards.todayContinue") : today.cards.length ? t("cards.todayStart") : t("cards.todayEmpty")} <ArrowRight size={14} aria-hidden="true" /></span>
      </Link>
      <section className="cards-recall-metrics" aria-label={t("cards.recallMetrics")}>
        <div>
          <strong>{t("cards.todayPausedRecall")}</strong>
          <span>{recall30.percent === null ? t("cards.todayNotEnoughData", { count: recall30.remainingForRate }) : `${recall30.percent}%`}</span>
          <small>{t("cards.todaySample", { success: recall30.success, total: recall30.total })}</small>
        </div>
        <div>
          <strong>{t("cards.todayPausedRecallSeven")}</strong>
          <span>{recall7.percent === null ? t("cards.todayNotEnoughData", { count: recall7.remainingForRate }) : `${recall7.percent}%`}</span>
          <small>{t("cards.todaySample", { success: recall7.success, total: recall7.total })}</small>
        </div>
      </section>
      <p className="cards-recall-disclaimer">{t("cards.recallMetricDisclaimer")}</p>
      <div className="cards-list" aria-label={t("cards.decks")}>
        {reviewCount > 0 && <CardReviewQueueRow count={reviewCount} />}
        {deckRows.map(({ deck, lesson, summary }) => (
          <CardDeckRow
            key={deck.id}
            deckId={deck.id}
            order={lesson.order}
            title={lesson.title}
            level={lesson.level}
            sourceLabel={lesson.subtitle ?? t("cards.lessonDeckFallback")}
            known={summary.known}
            total={summary.total}
            learning={summary.learning}
            percent={summary.percent}
          />
        ))}
      </div>
    </AppShell>
  );
}
