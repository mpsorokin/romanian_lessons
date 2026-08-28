import { memo } from "react";
import { Check, ArrowRight } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { Lesson, Story } from "@/lib/content";
import type { LessonStatus } from "@/features/reading/progress.types";
import { ProgressBar } from "@/components/ui/ProgressBar";

function padOrder(order: number) {
  return String(order).padStart(2, "0");
}

export const LessonRow = memo(function LessonRow({ lesson, status }: { lesson: Lesson; status: LessonStatus }) {
  const { t } = useTranslation();
  const statusLabel =
    status === "completed"
      ? t("content.lessonCompleted")
      : status === "in-progress"
        ? t("content.lessonCurrent")
        : t("content.lessonNew");
  const lengthLabel = lesson.wordCount ? t("reader.wordCount", { count: lesson.wordCount }) : t("reader.review");

  return (
    <Link className="content-row lesson-row" to={`/lessons/${lesson.id}`}>
      <span className="content-row__order">{padOrder(lesson.order)}</span>
      <span className="content-row__main">
        <strong>{lesson.title}</strong>
        {lesson.subtitle && <small>{lesson.subtitle}</small>}
      </span>
      <span className="content-row__meta">{lesson.level ?? "A1"}</span>
      <span className="content-row__meta content-row__words">{lengthLabel}</span>
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
  const { t } = useTranslation();
  const percent = Math.round(maxProgress * 100);
  const statusLabel = completed ? t("content.storyRead") : percent > 0 ? t("content.storyReading") : t("content.storyNew");

  return (
    <Link className="content-row story-row" to={`/stories/${story.id}`}>
      <span className="content-row__order">{padOrder(story.order)}</span>
      <span className="content-row__main">
        <strong>{story.title}</strong>
        {story.subtitle && <small>{story.subtitle}</small>}
        {percent > 0 && !completed && (
          <ProgressBar value={maxProgress} className="story-row__progress" label={t("content.percentRead", { percent })} />
        )}
      </span>
      <span className="content-row__meta">{story.level ?? "A1"}</span>
      <span className="content-row__meta content-row__words">
        {story.wordCount ? t("reader.wordCount", { count: story.wordCount }) : "—"}
      </span>
      <span className={`status-pill status-pill--${completed ? "completed" : percent > 0 ? "in-progress" : "new"}`}>
        {completed && <Check size={13} weight="bold" aria-hidden="true" />}
        {statusLabel}
      </span>
    </Link>
  );
});

export function ContinueArrow() {
  return <ArrowRight size={18} aria-hidden="true" />;
}
