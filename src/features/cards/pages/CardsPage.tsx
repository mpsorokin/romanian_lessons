import { useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CardDeckRow, CardReviewQueueRow } from "@/features/cards/components/CardDeckRow";
import { useCardProgressState } from "@/features/cards/useCardProgress";
import { cardDecks, getCardDeckProgress, getCardsForReviewQueue } from "@/features/cards/cards";
import { findContent } from "@/lib/content";
import { useTranslation } from "react-i18next";

export function CardsPage() {
  const { t } = useTranslation();
  const progress = useCardProgressState();
  const reviewCount = useMemo(() => getCardsForReviewQueue(progress.needToReview).length, [progress.needToReview]);
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
