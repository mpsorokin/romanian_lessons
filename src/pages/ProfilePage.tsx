import { ArrowRight, BookOpenText, Books, CardsThree, Gear, Stack, UserCircle } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { DarkShell } from "../components/PageShell";
import { ProgressBar, ProgressRing } from "../components/ProgressBar";
import { lessonContent, storyContent, allContent, getCurrentLevel, getLessonLengthLabel } from "../lib/content";
import { completedLessonCount, completedMaterialCount, completedStoryCount, overallProgress, getNextLesson } from "../lib/metrics";
import { useProgress } from "../features/progress/useProgress";
import { useCardProgressState } from "../features/cards/useCardProgress";
import { getTotalCardProgress } from "../lib/cards";

export function ProfilePage() {
  const { progress } = useProgress();
  const cardProgress = useCardProgressState();
  const lessonsDone = completedLessonCount(progress);
  const storiesDone = completedStoryCount(progress);
  const materialsDone = completedMaterialCount(progress);
  const nextLesson = getNextLesson(lessonContent, progress);
  const cardsDone = getTotalCardProgress(cardProgress);

  return (
    <DarkShell className="profile-shell">
      <div className="profile-heading-row"><h1>Профиль</h1></div>
      <section className="profile-identity"><div className="avatar-mark">C</div><div><h2>Локальный профиль</h2><p>Добро пожаловать<br />в Calea.</p></div></section>
      <section className="dark-card profile-progress-card">
        <p className="eyebrow">ПРОГРЕСС КУРСА</p>
        <div className="profile-progress-top"><ProgressRing value={overallProgress(progress, allContent)} label="Общий прогресс" /><div><strong>Общий прогресс</strong><span>Вы на верном пути.</span><ProgressBar value={overallProgress(progress, allContent)} /></div></div>
        <div className="profile-stat-row"><BookOpenText size={19} /><span>Пройдено уроков</span><strong>{lessonsDone} из {lessonContent.length}</strong></div>
        <div className="profile-stat-row"><Books size={19} /><span>Прочитано рассказов</span><strong>{storiesDone} из {storyContent.length}</strong></div>
        <div className="profile-stat-row"><CardsThree size={19} /><span>Закреплено карточек</span><strong>{cardsDone.known} из {cardsDone.total}</strong></div>
        <div className="profile-stat-row"><Stack size={19} /><span>Текущий уровень</span><strong>{getCurrentLevel()}</strong></div>
      </section>
      <section className="profile-next-section"><p className="eyebrow">ПРОДОЛЖИТЬ ОБУЧЕНИЕ</p>{nextLesson ? <Link to={`/lessons/${nextLesson.id}`} className="next-card"><div><span>Урок {String(nextLesson.order).padStart(2, "0")} · {nextLesson.level ?? "A1"}</span><strong>{nextLesson.title}</strong><small>{getLessonLengthLabel(nextLesson)}</small></div><ArrowRight size={22} /></Link> : <p className="empty-copy">Все уроки пройдены.</p>}</section>
      <div className="profile-links"><Link to="/stats"><span><UserCircle size={18} /> Статистика</span><ArrowRight size={17} /></Link><Link to="/settings"><span><Gear size={18} /> Настройки</span><ArrowRight size={17} /></Link></div>
      <p className="profile-total">Всего материалов: {materialsDone} / {allContent.length}</p>
    </DarkShell>
  );
}
