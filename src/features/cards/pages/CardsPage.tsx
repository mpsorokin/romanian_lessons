import { AppShell } from "@/components/layout/AppShell";
import { CardDeckRow, CardReviewQueueRow } from "@/features/cards/components/CardDeckRow";
import { useCardProgressState } from "@/features/cards/useCardProgress";
import { cardDecks, getCardDeckProgress, getCardsForReviewQueue } from "@/features/cards/cards";
import { findContent } from "@/lib/content";
import { useTranslation } from "react-i18next";

export function CardsPage() {
  const { t } = useTranslation();
  const progress = useCardProgressState();
  const reviewCards = getCardsForReviewQueue(progress.needToReview);

  return (
    <AppShell title={t("cards.title")} className="cards-shell">
      <div className="cards-intro">
        <p className="eyebrow">{t("cards.activeRecallEyebrow")}</p>
        <p>{t("cards.intro")}</p>
      </div>
      <div className="cards-list" aria-label={t("cards.decks")}>
        {reviewCards.length > 0 && <CardReviewQueueRow count={reviewCards.length} />}
        {cardDecks.map((deck) => {
          const lesson = findContent("lesson", deck.lessonId);
          if (!lesson) return null;
          const sourceLabel = lesson.subtitle ?? t("cards.lessonDeckFallback");
          const progressSummary = getCardDeckProgress(deck.id, progress);
          return (
            <CardDeckRow
              key={deck.id}
              deckId={deck.id}
              order={lesson.order}
              title={lesson.title}
              level={lesson.level}
              sourceLabel={sourceLabel}
              known={progressSummary.known}
              total={progressSummary.total}
              learning={progressSummary.learning}
              percent={progressSummary.percent}
            />
          );
        })}
      </div>
    </AppShell>
  );
}
