import { AppShell } from "@/components/layout/AppShell";
import { CardDeckRow } from "@/features/cards/components/CardDeckRow";
import { useCardProgressState } from "@/features/cards/useCardProgress";
import { cardDecks, getCardDeckProgress } from "@/features/cards/cards";
import { findContent } from "@/lib/content";
import { useTranslation } from "react-i18next";

export function CardsPage() {
  const { t } = useTranslation();
  const progress = useCardProgressState();

  return (
    <AppShell title={t("cards.title")} className="cards-shell">
      <div className="cards-intro">
        <p className="eyebrow">{t("cards.activeRecallEyebrow")}</p>
        <p>{t("cards.intro")}</p>
      </div>
      <div className="cards-list" aria-label={t("cards.decks")}>
        {cardDecks.map((deck) => {
          const lesson = findContent("lesson", deck.lessonId);
          if (!lesson) return null;
          const sourceLessons = deck.sourceLessonIds.map((id) => findContent("lesson", id)).filter(Boolean);
          const sourceLabel =
            deck.kind === "recall"
              ? t("cards.recallSource", { orders: sourceLessons.map((item) => item?.order).join("–") })
              : (lesson.subtitle ?? t("cards.lessonDeckFallback"));
          return (
            <CardDeckRow
              key={deck.id}
              deckId={deck.id}
              order={lesson.order}
              title={lesson.title}
              level={lesson.level}
              sourceLabel={sourceLabel}
              summary={getCardDeckProgress(deck.id, progress)}
            />
          );
        })}
      </div>
    </AppShell>
  );
}
