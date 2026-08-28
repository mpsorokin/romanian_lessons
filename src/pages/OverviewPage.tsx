import { BookOpenText, Books, CardsThree, TextT } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { ContinueArrow } from "@/features/reading/components/ContentRow";
import { AppShell } from "@/components/layout/AppShell";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { lessonContent, storyContent } from "@/lib/content";
import { completedLessonCount, completedStoryCount, getActiveStory, getNextLesson } from "@/features/reading/metrics";
import { useProgress } from "@/features/reading/useProgress";
import { useCardProgressState } from "@/features/cards/useCardProgress";
import { getTotalCardProgress } from "@/features/cards/cardStats";

export function OverviewPage() {
  const { progress, getStoryProgress } = useProgress();
  const cardProgress = useCardProgressState();
  const completedLessons = completedLessonCount(progress);
  const completedStories = completedStoryCount(progress);
  const cardsDone = getTotalCardProgress(cardProgress);
  const nextLesson = getNextLesson(lessonContent, progress);
  const activeStory = getActiveStory(storyContent, progress);

  return (
    <AppShell className="dashboard-shell">
      <section className="continue-card" aria-label="Продолжить обучение">
        <p className="eyebrow">ПРОДОЛЖИТЬ</p>
        {nextLesson ? (
          <Link to={`/lessons/${nextLesson.id}`} className="continue-card__link">
            <div>
              <h3>{nextLesson.title}</h3>
              <p>
                Урок {String(nextLesson.order).padStart(2, "0")} · {nextLesson.level ?? "A1"}
              </p>
            </div>
            <span className="outline-button">
              Продолжить <ContinueArrow />
            </span>
          </Link>
        ) : (
          <p className="empty-copy">Все уроки пройдены. Можно перечитать любой текст.</p>
        )}
        {nextLesson && (
          <ProgressBar
            value={progress.lessons[nextLesson.id]?.resumePosition ?? 0}
            label="Позиция урока для продолжения"
          />
        )}
      </section>

      {activeStory && (
        <Link to={`/stories/${activeStory.id}`} className="resume-story-row" aria-label="Продолжить чтение рассказа">
          <div>
            <p className="eyebrow">ПРОДОЛЖИТЬ ЧТЕНИЕ</p>
            <strong>{activeStory.title}</strong>
            <span>{Math.round(getStoryProgress(activeStory.id).maxProgress * 100)}% прочитано</span>
          </div>
          <ContinueArrow />
        </Link>
      )}

      <section className="launcher-grid" aria-label="Разделы приложения">
        <Link to="/library/lessons" className="launcher-card">
          <BookOpenText size={24} weight="regular" aria-hidden="true" />
          <div>
            <p className="eyebrow">УРОКИ</p>
            <strong>
              {completedLessons} <span>/ {lessonContent.length}</span>
            </strong>
            <small>Пройдено</small>
          </div>
          <ProgressBar value={lessonContent.length ? completedLessons / lessonContent.length : 0} />
        </Link>
        <Link to="/library/stories" className="launcher-card">
          <Books size={24} weight="regular" aria-hidden="true" />
          <div>
            <p className="eyebrow">РАССКАЗЫ</p>
            <strong>
              {completedStories} <span>/ {storyContent.length}</span>
            </strong>
            <small>Прочитано</small>
          </div>
          <ProgressBar value={storyContent.length ? completedStories / storyContent.length : 0} />
        </Link>
        <Link to="/cards" className="launcher-card">
          <CardsThree size={24} weight="regular" aria-hidden="true" />
          <div>
            <p className="eyebrow">КАРТОЧКИ</p>
            <strong>
              {cardsDone.known} <span>/ {cardsDone.total}</span>
            </strong>
            <small>Закреплено</small>
          </div>
          <ProgressBar value={cardsDone.percent} />
        </Link>
        <Link to="/library/grammar" className="launcher-card">
          <TextT size={24} weight="regular" aria-hidden="true" />
          <div>
            <p className="eyebrow">ГРАММАТИКА</p>
            <strong>Справочник</strong>
            <small>Правила и таблицы</small>
          </div>
        </Link>
      </section>
    </AppShell>
  );
}
