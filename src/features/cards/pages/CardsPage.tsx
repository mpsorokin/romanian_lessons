import { AppShell } from "@/components/layout/AppShell";
import { CardDeckRow } from "@/features/cards/components/CardDeckRow";
import { useCardProgressState } from "@/features/cards/useCardProgress";
import { cardDecks, getCardDeckProgress } from "@/features/cards/cards";
import { findContent } from "@/lib/content";

export function CardsPage() {
  const progress = useCardProgressState();

  return (
    <AppShell title="Карточки" showBack className="cards-shell">
      <div className="cards-intro">
        <p className="eyebrow">АКТИВНОЕ ВОСПОИЗВЕДЕНИЕ</p>
        <p>Вспоминайте русскую подсказку по-румынски и отмечайте фразы, которые уже закрепились.</p>
      </div>
      <div className="cards-list" aria-label="Колоды карточек">
        {cardDecks.map((deck) => {
          const lesson = findContent("lesson", deck.lessonId);
          if (!lesson) return null;
          const sourceLessons = deck.sourceLessonIds.map((id) => findContent("lesson", id)).filter(Boolean);
          const sourceLabel = deck.kind === "recall"
            ? `Повторение · уроки ${sourceLessons.map((item) => item?.order).join("–")}`
            : lesson.subtitle ?? "Карточки урока";
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
