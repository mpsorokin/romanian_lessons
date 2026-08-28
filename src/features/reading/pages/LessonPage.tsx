import { BookOpenText, Check } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { BackButton } from "@/components/ui/BackButton";

import { ReaderShell } from "@/components/layout/ReaderShell";
import { MarkdownViewer } from "@/features/reader/MarkdownViewer";
import { ReaderControls } from "@/features/reader/ReaderControls";
import { useProgressActions } from "@/features/reading/useProgress";
import { useReaderSettings } from "@/features/reader/ReaderSettingsProvider";
import { findContent, getLessonLengthLabel } from "@/lib/content";
import { useContentBody } from "@/features/reader/useContentBody";
import { useReaderScroll } from "@/features/reader/useReaderScroll";
import { ReaderNotFoundPage } from "@/features/reading/pages/ReaderNotFoundPage";

export function LessonPage() {
  const { id = "" } = useParams();
  const lesson = findContent("lesson", id);
  const { settings } = useReaderSettings();
  const { getProgressSnapshot, openLesson, saveLessonPosition, completeLesson } = useProgressActions();
  const { body, error } = useContentBody(lesson);
  const [completed, setCompleted] = useState(false);

  // Read once per lesson: the live value changes on every scroll save and would restart the
  // restore effect. Keyed by id because the route reuses this component across `/lessons/:id`.
  const initial = useRef<{ id: string; position: number } | null>(null);
  if (lesson && initial.current?.id !== lesson.id) {
    initial.current = { id: lesson.id, position: getProgressSnapshot().lessons[lesson.id]?.resumePosition ?? 0 };
  }
  const initialPosition = initial.current?.position ?? 0;

  useEffect(() => {
    if (lesson) {
      openLesson(lesson.id);
      setCompleted(getProgressSnapshot().lessons[lesson.id]?.status === "completed");
    }
  }, [lesson, openLesson, getProgressSnapshot]);

  const savePosition = useCallback(
    (position: number) => {
      if (lesson) saveLessonPosition(lesson.id, position);
    },
    [lesson, saveLessonPosition],
  );

  const scrollRef = useReaderScroll(lesson?.id ?? "missing", initialPosition, savePosition, body !== null);

  const handleComplete = () => {
    if (!lesson) return;
    completeLesson(lesson.id);
    setCompleted(true);
  };

  if (!lesson) return <ReaderNotFoundPage kind="урок" />;

  return (
    <ReaderShell theme={settings.theme} className="reader-shell--lesson">
      <header className="reader-header">
        <BackButton to="/library/lessons" />
        <div className="reader-header__title"><span>Урок {String(lesson.order).padStart(2, "0")} · {lesson.level ?? "A1"}</span><strong>{lesson.title}</strong></div>
        <ReaderControls />
      </header>
      <div
        className="reader-scroll"
        ref={scrollRef}
        style={{ "--reader-size": `${settings.fontSize}px`, "--reader-line-height": settings.lineHeight } as React.CSSProperties}
      >
        <article className="reader-article">
          {body !== null ? (
            <MarkdownViewer markdown={body} />
          ) : (
            <p className="reader-placeholder">{error ? "Не удалось загрузить урок." : "Загрузка…"}</p>
          )}
        </article>
        <div className="reader-meta"><BookOpenText size={16} aria-hidden="true" /> <span>{getLessonLengthLabel(lesson)}</span><span>·</span><span>{lesson.subtitle}</span></div>
        <div className="reader-action"><button className={`primary-button ${completed ? "primary-button--completed" : ""}`} type="button" onClick={handleComplete} disabled={completed}>{completed && <Check size={17} weight="bold" />} {completed ? "Урок пройден" : "Завершить урок"}</button></div>
      </div>
    </ReaderShell>
  );
}
