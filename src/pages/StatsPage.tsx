import { ArrowRight, BookOpenText, Books, CardsThree, Stack } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { lessonContent, storyContent, allContent, getCurrentLevel } from "@/lib/content";
import { completedLessonCount, completedMaterialCount, completedStoryCount, overallProgress, averageStoryLength, estimatedWordsRead, getLastTouched } from "@/features/reading/metrics";
import { useProgress } from "@/features/reading/useProgress";
import { useCardProgressState } from "@/features/cards/useCardProgress";
import { getTotalCardProgress } from "@/features/cards/cards";

export function StatsPage() {
  const { progress } = useProgress();
  const cardProgress = useCardProgressState();
  const lessonsDone = completedLessonCount(progress);
  const storiesDone = completedStoryCount(progress);
  const materialsDone = completedMaterialCount(progress);
  const lastLesson = getLastTouched(lessonContent, progress, "lesson");
  const lastStory = getLastTouched(storyContent, progress, "story");
  const cardsDone = getTotalCardProgress(cardProgress);

  return (
    <AppShell className="stats-shell" right={<span />}> 
      <h1 className="page-heading">Статистика</h1>
      <section className="stats-section"><p className="eyebrow">ОБУЧЕНИЕ</p><div className="dark-card stat-card-group"><StatMetric icon={<BookOpenText size={23} />} label="Уроки" detail="Пройдено" value={`${lessonsDone}/${lessonContent.length}`} progress={lessonContent.length ? lessonsDone / lessonContent.length : 0} /><StatMetric icon={<Books size={23} />} label="Рассказы" detail="Прочитано" value={`${storiesDone}/${storyContent.length}`} progress={storyContent.length ? storiesDone / storyContent.length : 0} /><StatMetric icon={<CardsThree size={23} />} label="Карточки" detail="Закреплено" value={`${cardsDone.known}/${cardsDone.total}`} progress={cardsDone.percent} /><StatMetric icon={<Stack size={23} />} label="Всего материалов" detail="Доступно" value={`${materialsDone}/${allContent.length}`} progress={overallProgress(progress, allContent)} /></div></section>
      <section className="stats-section"><p className="eyebrow">ДЕТАЛИ</p><div className="dark-card detail-card"><DetailRow label="Общий прогресс" value={`${Math.round(overallProgress(progress, allContent) * 100)}%`} /><DetailRow label="Карточки закреплены" value={`${cardsDone.known} из ${cardsDone.total}`} /><DetailRow label="Текущий уровень" value={getCurrentLevel()} /><DetailRow label="Последний урок" value={lastLesson?.title ?? "Пока нет"} to={lastLesson ? `/lessons/${lastLesson.id}` : undefined} /><DetailRow label="Последний рассказ" value={lastStory?.title ?? "Пока нет"} to={lastStory ? `/stories/${lastStory.id}` : undefined} /><DetailRow label="Средняя длина рассказов" value={`${averageStoryLength(storyContent)} слов`} /><DetailRow label="Примерно прочитано" value={`${estimatedWordsRead(storyContent, progress)} слов`} /></div></section>
      <Link className="stats-back-link" to="/profile"><ArrowRight size={17} /> Вернуться в профиль</Link>
    </AppShell>
  );
}

function StatMetric({ icon, label, detail, value, progress }: { icon: React.ReactNode; label: string; detail: string; value: string; progress: number }) {
  return <div className="stat-metric"><div className="stat-metric__line"><span className="stat-metric__icon">{icon}</span><span><strong>{label}</strong><small>{detail}</small></span><b>{value}</b></div><ProgressBar value={progress} /></div>;
}

function DetailRow({ label, value, to }: { label: string; value: string; to?: string }) {
  const content = <><span>{label}</span><strong>{value}</strong>{to && <ArrowRight size={16} />}</>;
  return to ? <Link className="detail-row" to={to}>{content}</Link> : <div className="detail-row">{content}</div>;
}
