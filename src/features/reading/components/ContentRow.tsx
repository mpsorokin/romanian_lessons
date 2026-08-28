import { memo } from "react";
import { Check, ArrowRight } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import type { Lesson, Story } from "@/lib/content";
import { getLessonLengthLabel } from "@/lib/content";
import type { LessonStatus } from "@/features/reading/progress.types";
import { ProgressBar } from "@/components/ui/ProgressBar";

function padOrder(order: number) {
  return String(order).padStart(2, "0");
}

export const LessonRow = memo(function LessonRow({ lesson, status }: { lesson: Lesson; status: LessonStatus }) {
  const statusLabel = status === "completed" ? "Пройден" : status === "in-progress" ? "Текущий" : "Новый";
  return (
    <Link className="content-row lesson-row" to={`/lessons/${lesson.id}`}>
      <span className="content-row__order">{padOrder(lesson.order)}</span>
      <span className="content-row__main">
        <strong>{lesson.title}</strong>
        {lesson.subtitle && <small>{lesson.subtitle}</small>}
      </span>
      <span className="content-row__meta">{lesson.level ?? "A1"}</span>
      <span className="content-row__meta content-row__words">{getLessonLengthLabel(lesson)}</span>
      <span className={`status-pill status-pill--${status}`}>
        {status === "completed" && <Check size={13} weight="bold" aria-hidden="true" />}
        {statusLabel}
      </span>
    </Link>
  );
});

// Primitive props on purpose: an inline `{ maxProgress, completed }` object would defeat the memo.
export const StoryRow = memo(function StoryRow({
  story,
  maxProgress,
  completed,
}: {
  story: Story;
  maxProgress: number;
  completed: boolean;
}) {
  const percent = Math.round(maxProgress * 100);
  const statusLabel = completed ? "Прочитано" : percent > 0 ? "Читаю" : "Новый";
  return (
    <Link className="content-row story-row" to={`/stories/${story.id}`}>
      <span className="content-row__order">{padOrder(story.order)}</span>
      <span className="content-row__main">
        <strong>{story.title}</strong>
        {story.subtitle && <small>{story.subtitle}</small>}
        {percent > 0 && <ProgressBar value={maxProgress} className="story-row__progress" label={`${percent}% прочитано`} />}
      </span>
      <span className="content-row__meta">{story.level ?? "A1"}</span>
      <span className="content-row__meta content-row__words">{story.wordCount ?? "—"} слов</span>
      <span className={`status-pill status-pill--${completed ? "completed" : percent > 0 ? "in-progress" : "new"}`}>
        {completed && <Check size={13} weight="bold" aria-hidden="true" />}
        {statusLabel}
      </span>
    </Link>
  );
});

export function ContinueArrow() {
  return <ArrowRight size={20} weight="regular" aria-hidden="true" />;
}
