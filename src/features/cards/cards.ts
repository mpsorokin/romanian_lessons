import { generatedCardDecks, generatedStudyCards, type GeneratedCardDeck, type GeneratedStudyCard } from "@/generated/cards.generated";
import type { CardDeckProgress, CardProgressState } from "@/features/cards/cardProgress.types";
import { findContent, lessonContent } from "@/lib/content";

export type StudyCard = GeneratedStudyCard;

export type CardDeckKind = "lesson";

export const NEED_TO_REVIEW_DECK_ID = "need-to-review";

export interface CardDeck extends GeneratedCardDeck {
  kind: CardDeckKind;
}

export const studyCards: StudyCard[] = generatedStudyCards;
export const cardDecks: CardDeck[] = generatedCardDecks;

const cardsByLesson = new Map<string, StudyCard[]>();
for (const card of studyCards) {
  const cards = cardsByLesson.get(card.lessonId) ?? [];
  cards.push(card);
  cardsByLesson.set(card.lessonId, cards);
}

const cardsById = new Map(studyCards.map((card) => [card.id, card]));
const decksById = new Map(cardDecks.map((deck) => [deck.id, deck]));
const decksByLesson = new Map(cardDecks.map((deck) => [deck.lessonId, deck]));

const cardsByDeck = new Map<string, StudyCard[]>();
for (const deck of cardDecks) {
  const cards: StudyCard[] = [];
  for (const lessonId of deck.sourceLessonIds) {
    const lessonCards = cardsByLesson.get(lessonId);
    if (lessonCards) cards.push(...lessonCards);
  }
  cardsByDeck.set(deck.id, cards);
}

function assertCardData() {
  if (cardsById.size !== studyCards.length) throw new Error("Card IDs must be unique.");
  if (new Set(cardDecks.map((deck) => deck.id)).size !== cardDecks.length) throw new Error("Card deck IDs must be unique.");
  const lessonIds = new Set(lessonContent.map((lesson) => lesson.id));
  for (const card of studyCards) {
    if (!lessonIds.has(card.lessonId)) throw new Error("Unknown lesson for card " + card.id + ".");
  }

  for (const lesson of lessonContent) {
    const cards = cardsByLesson.get(lesson.id) ?? [];
    if (lesson.wordCount && cards.length !== lesson.wordCount) {
      throw new Error(`${lesson.id}: expected ${lesson.wordCount} cards, found ${cards.length}. Run npm run generate:cards.`);
    }
    for (const card of cards) {
      if (card.order < 1 || card.order > cards.length) throw new Error(`${card.id}: invalid card order.`);
      if (!card.promptRu || !card.answerRo || !card.pronunciation) throw new Error(`${card.id}: missing card copy.`);
    }
    const orders = cards.map((card) => card.order).sort((a, b) => a - b);
    if (orders.some((order, index) => order !== index + 1)) throw new Error(lesson.id + ": card order must be continuous.");

    const deck = decksByLesson.get(lesson.id);
    if ((lesson.wordCount ?? 0) > 0 && !deck) throw new Error(`${lesson.id}: missing card deck.`);
    if (!lesson.wordCount && deck) throw new Error(`${lesson.id}: Recall lessons must not have card decks.`);
  }

  for (const deck of cardDecks) {
    if (!findContent("lesson", deck.lessonId)) throw new Error(`${deck.id}: missing lesson metadata.`);
    if (!deck.sourceLessonIds.length) throw new Error(`${deck.id}: deck has no source lessons.`);
    if (new Set(deck.sourceLessonIds).size !== deck.sourceLessonIds.length) throw new Error(`${deck.id}: duplicate source lessons.`);
    if (deck.sourceLessonIds.length !== 1 || deck.sourceLessonIds[0] !== deck.lessonId) {
      throw new Error(`${deck.id}: lesson decks must contain only their own lesson.`);
    }
    for (const lessonId of deck.sourceLessonIds) {
      if (!findContent("lesson", lessonId)) throw new Error(`${deck.id}: unknown source lesson ${lessonId}.`);
    }
  }
}

if (import.meta.env.DEV) assertCardData();

export function findCardDeck(id: string): CardDeck | undefined {
  return decksById.get(id);
}

export function getCardsForDeck(deckId: string): StudyCard[] {
  return cardsByDeck.get(deckId) ?? [];
}

/** Resolves persisted queue IDs without changing their insertion order. */
export function getCardsForReviewQueue(ids: readonly string[]): StudyCard[] {
  return ids.flatMap((id) => {
    const card = cardsById.get(id);
    return card ? [card] : [];
  });
}

export function getCardDeckProgress(deckId: string, progress: CardProgressState): CardDeckProgress {
  const cards = getCardsForDeck(deckId);
  let known = 0;
  let learning = 0;
  for (const card of cards) {
    if (progress.cards[card.id]?.status === "known") known += 1;
    else if (progress.cards[card.id]?.status === "learning") learning += 1;
  }
  const total = cards.length;
  return { total, known, learning, newCount: Math.max(0, total - known - learning), percent: total ? known / total : 0 };
}
