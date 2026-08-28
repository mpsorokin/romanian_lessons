import { ArrowRight, BookOpenText, Books, CardsThree, Gear, Stack } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { lessonContent, storyContent, allContent, getCurrentLevel } from "@/lib/content";
import {
  averageStoryLength,
  completedLessonCount,
  completedMaterialCount,
  completedStoryCount,
  estimatedWordsRead,
  getLastTouched,
  overallProgress,
} from "@/features/reading/metrics";
import { useProgress } from "@/features/reading/useProgress";
import { useCardProgressState } from "@/features/cards/useCardProgress";
import { getTotalCardProgress } from "@/features/cards/cardStats";

export function ProfilePage() {
  const { progress } = useProgress();
  const cardProgress = useCardProgressState();
  const lessonsDone = completedLessonCount(progress);
  const storiesDone = completedStoryCount(progress);
  const materialsDone = completedMaterialCount(progress);
  const courseProgress = overallProgress(progress, allContent);
  const cardsDone = getTotalCardProgress(cardProgress);
  const lastLesson = getLastTouched(lessonContent, progress, "lesson");
  const lastStory = getLastTouched(storyContent, progress, "story");

  return (
    <AppShell title="Профиль" className="profile-shell">
      <section className="profile-identity">
        <div className="avatar-mark">C</div>
        <div>
          <h2>Локальный профиль</h2>
          <p>
            Добро пожаловать
            <br />в Calea.
          </p>
        </div>
      </section>

      <section className="dark-card profile-progress-card">
        <p className="eyebrow">ПРОГРЕСС КУРСА</p>
        <div className="profile-progress-top">
          <ProgressRing value={courseProgress} label="Общий прогресс" />
          <div>
            <strong>Общий прогресс</strong>
            <span>
              {materialsDone} из {allContent.length} материалов
            </span>
            <ProgressBar value={courseProgress} />
          </div>
        </div>
        <div className="profile-stat-row">
          <BookOpenText size={19} />
          <span>Пройдено уроков</span>
          <strong>
            {lessonsDone} из {lessonContent.length}
          </strong>
        </div>
        <div className="profile-stat-row">
          <Books size={19} />
          <span>Прочитано рассказов</span>
          <strong>
            {storiesDone} из {storyContent.length}
          </strong>
        </div>
        <div className="profile-stat-row">
          <CardsThree size={19} />
          <span>Закреплено карточек</span>
          <strong>
            {cardsDone.known} из {cardsDone.total}
          </strong>
        </div>
        <div className="profile-stat-row">
          <Stack size={19} />
          <span>Текущий уровень</span>
          <strong>{getCurrentLevel()}</strong>
        </div>
      </section>

      <section className="stats-section profile-details-section">
        <p className="eyebrow">ДЕТАЛИ</p>
        <div className="dark-card detail-card">
          <DetailRow label="Последний урок" value={lastLesson?.title ?? "Пока нет"} to={lastLesson ? `/lessons/${lastLesson.id}` : undefined} />
          <DetailRow label="Последний рассказ" value={lastStory?.title ?? "Пока нет"} to={lastStory ? `/stories/${lastStory.id}` : undefined} />
          <DetailRow label="Средняя длина рассказов" value={`${averageStoryLength(storyContent)} слов`} />
          <DetailRow label="Примерно прочитано" value={`${estimatedWordsRead(storyContent, progress)} слов`} />
        </div>
      </section>

      <div className="profile-links">
        <Link to="/settings">
          <span>
            <Gear size={18} /> Настройки
          </span>
          <ArrowRight size={17} />
        </Link>
      </div>
    </AppShell>
  );
}

function DetailRow({ label, value, to }: { label: string; value: string; to?: string }) {
  const content = (
    <>
      <span>{label}</span>
      <strong>{value}</strong>
      {to && <ArrowRight size={16} />}
    </>
  );
  return to ? (
    <Link className="detail-row" to={to}>
      {content}
    </Link>
  ) : (
    <div className="detail-row">{content}</div>
  );
}
