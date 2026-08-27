import { BookOpenText, Books, ArrowUpRight } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { ContinueArrow, LessonRow } from "../components/ContentRow";
import { DarkShell } from "../components/PageShell";
import { ProgressBar, ProgressRing } from "../components/ProgressBar";
import { lessonContent, storyContent, allContent } from "../lib/content";
import { completedLessonCount, completedMaterialCount, completedStoryCount, getActiveStory, getNextLesson, getRecentLessons, overallProgress } from "../lib/metrics";
import { useProgress } from "../features/progress/useProgress";

export function OverviewPage() {
  const { progress, getLessonStatus, getStoryProgress } = useProgress();
  const completedLessons = completedLessonCount(progress);
  const completedStories = completedStoryCount(progress);
  const completedMaterials = completedMaterialCount(progress);
  const courseProgress = overallProgress(progress, allContent);
  const nextLesson = getNextLesson(lessonContent, progress);
  const activeStory = getActiveStory(storyContent, progress);
  const recentLessons = getRecentLessons(lessonContent, progress);

  return (
    <DarkShell className="dashboard-shell">
      <section className="dashboard-intro">
        <div>
          <p className="eyebrow">STUDIO DE LECTURĂ</p>
          <h2>Calea</h2>
          <p className="intro-copy">Румынский через чтение. Короткие уроки и рассказы — с прогрессом по каждому тексту.</p>
        </div>
        <div className="dashboard-ring">
          <ProgressRing value={courseProgress} label="Общий прогресс курса" />
          <span>из {allContent.length}</span>
        </div>
      </section>

      <section className="continue-card" aria-label="Продолжить обучение">
        <p className="eyebrow">ПРОДОЛЖИТЬ</p>
        {nextLesson ? (
          <Link to={`/lessons/${nextLesson.id}`} className="continue-card__link">
            <div>
              <h3>{nextLesson.title}</h3>
              <p>Урок {String(nextLesson.order).padStart(2, "0")} · {nextLesson.level ?? "A1"}</p>
            </div>
            <span className="outline-button">Продолжить <ContinueArrow /></span>
          </Link>
        ) : (
          <p className="empty-copy">Все уроки пройдены. Можно перечитать любой текст.</p>
        )}
        {nextLesson && <ProgressBar value={progress.lessons[nextLesson.id]?.resumePosition ?? 0} label="Позиция урока для продолжения" />}
      </section>

      <section className="metric-grid" aria-label="Прогресс материалов">
        <div className="metric-card">
          <BookOpenText size={25} weight="regular" aria-hidden="true" />
          <div><p className="eyebrow">УРОКИ</p><strong>{completedLessons} <span>/ {lessonContent.length}</span></strong><small>Пройдено</small></div>
          <ProgressBar value={lessonContent.length ? completedLessons / lessonContent.length : 0} />
        </div>
        <div className="metric-card">
          <Books size={25} weight="regular" aria-hidden="true" />
          <div><p className="eyebrow">РАССКАЗЫ</p><strong>{completedStories} <span>/ {storyContent.length}</span></strong><small>Прочитано</small></div>
          <ProgressBar value={storyContent.length ? completedStories / storyContent.length : 0} />
        </div>
      </section>

      {activeStory && (
        <section className="story-continue-row">
          <div>
            <p className="eyebrow">ПРОДОЛЖИТЬ ЧТЕНИЕ</p>
            <Link to={`/stories/${activeStory.id}`}><strong>{activeStory.title}</strong><span>{Math.round(getStoryProgress(activeStory.id).maxProgress * 100)}% прочитано</span></Link>
          </div>
          <Link to={`/stories/${activeStory.id}`} className="icon-button" aria-label="Продолжить чтение"><ArrowUpRight size={20} /></Link>
        </section>
      )}

      <section className="section-block">
        <div className="section-heading"><h3>Последние уроки</h3><Link to="/lessons">Все уроки <ArrowUpRight size={15} /></Link></div>
        <div className="content-list content-list--compact">
          {recentLessons.map((lesson) => <LessonRow key={lesson.id} lesson={lesson} status={getLessonStatus(lesson.id)} />)}
        </div>
      </section>

      <div className="dashboard-footer-stat"><span>Всего материалов</span><strong>{completedMaterials} / {allContent.length}</strong></div>
    </DarkShell>
  );
}
