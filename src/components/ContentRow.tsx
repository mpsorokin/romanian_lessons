import { Check, ArrowRight, Lock } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import type { Lesson, Story } from "../lib/content";
import type { LessonStatus } from "../features/progress/progress.types";
import { ProgressBar } from "./ProgressBar";

function padOrder(order: number) {
  return String(order).padStart(2, "0");
}

export function LessonRow({ lesson, status }: { lesson: Lesson; status: LessonStatus }) {
  const statusLabel = status === "completed" ? "Пройден" : status === "in-progress" ? "Текущий" : "Новый";
  return (
    <Link className="content-row lesson-row" to={`/lessons/${lesson.id}`}>
      <span className="content-row__order">{padOrder(lesson.order)}</span>
      <span className="content-row__main">
        <strong>{lesson.title}</strong>
        {lesson.subtitle && <small>{lesson.subtitle}</small>}
      </span>
      <span className="content-row__meta">{lesson.level ?? "A1"}</span>
      <span className="content-row__meta content-row__words">{lesson.wordCount ?? "—"} слов</span>
      <span className={`status-pill status-pill--${status}`}>
        {status === "completed" && <Check size={13} weight="bold" aria-hidden="true" />}
        {statusLabel}
      </span>
    </Link>
  );
}

export function StoryRow({ story, progress }: { story: Story; progress: { maxProgress: number; completed: boolean } }) {
  const percent = Math.round(progress.maxProgress * 100);
  const statusLabel = progress.completed ? "Прочитано" : percent > 0 ? "Читаю" : "Новый";
  return (
    <Link className="content-row story-row" to={`/stories/${story.id}`}>
      <span className="content-row__order">{padOrder(story.order)}</span>
      <span className="content-row__main">
        <strong>{story.title}</strong>
        {story.subtitle && <small>{story.subtitle}</small>}
        {percent > 0 && <ProgressBar value={progress.maxProgress} className="story-row__progress" label={`${percent}% прочитано`} />}
      </span>
      <span className="content-row__meta">{story.level ?? "A1"}</span>
      <span className="content-row__meta content-row__words">{story.wordCount ?? "—"} слов</span>
      <span className={`status-pill status-pill--${progress.completed ? "completed" : percent > 0 ? "in-progress" : "new"}`}>
        {progress.completed && <Check size={13} weight="bold" aria-hidden="true" />}
        {statusLabel}
      </span>
    </Link>
  );
}

export function ContinueArrow() {
  return <ArrowRight size={20} weight="regular" aria-hidden="true" />;
}

export function LockedLabel() {
  return (
    <span className="status-pill status-pill--locked">
      <Lock size={13} aria-hidden="true" /> Скоро
    </span>
  );
}
