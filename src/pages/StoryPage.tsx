import { BookOpenText, Check } from "@phosphor-icons/react";
import { useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { BackButton, ReaderShell } from "../components/PageShell";
import { MarkdownViewer } from "../components/MarkdownViewer";
import { ReaderControls } from "../components/ReaderControls";
import { ProgressBar } from "../components/ProgressBar";
import { useProgressActions, useProgressState } from "../features/progress/useProgress";
import { useReaderSettings } from "../features/reader-settings/ReaderSettingsProvider";
import { findContent } from "../lib/content";
import { useContentBody } from "../hooks/useContentBody";
import { useReaderScroll } from "../hooks/useReaderScroll";
import { ReaderNotFoundPage } from "./ReaderNotFoundPage";

export function StoryPage() {
  const { id = "" } = useParams();
  const story = findContent("story", id);
  const { settings } = useReaderSettings();
  const { getProgressSnapshot, saveStoryPosition, completeStory } = useProgressActions();
  const progress = useProgressState();
  const { body, error } = useContentBody(story);

  // Read once per story: the live value changes on every scroll save and would restart the
  // restore effect. Keyed by id because the route reuses this component across `/stories/:id`.
  const initial = useRef<{ id: string; position: number } | null>(null);
  if (story && initial.current?.id !== story.id) {
    initial.current = { id: story.id, position: getProgressSnapshot().stories[story.id]?.resumePosition ?? 0 };
  }
  const initialPosition = initial.current?.position ?? 0;

  const savePosition = useCallback(
    (position: number) => {
      if (story) saveStoryPosition(story.id, position, position);
    },
    [story, saveStoryPosition],
  );

  const scrollRef = useReaderScroll(story?.id ?? "missing", initialPosition, savePosition, body !== null);

  if (!story) return <ReaderNotFoundPage kind="рассказ" />;
  const entry = progress.stories[story.id];
  const maxProgress = entry?.maxProgress ?? 0;
  const completed = entry?.completed ?? false;
  const achievedPercent = Math.round(maxProgress * 100);
  const estimatedWords = Math.round((story.wordCount ?? 0) * maxProgress);

  return (
    <ReaderShell theme={settings.theme} className="reader-shell--story">
      <header className="reader-header">
        <BackButton to="/stories" />
        <div className="reader-header__title"><span>Рассказ {String(story.order).padStart(2, "0")} · {story.level ?? "A1"}</span><strong>{story.title}</strong></div>
        <ReaderControls />
      </header>
      <div
        className="reader-scroll"
        ref={scrollRef}
        style={{ "--reader-size": `${settings.fontSize}px`, "--reader-line-height": settings.lineHeight } as React.CSSProperties}
      >
        <div className="story-progress-top"><div><span>{estimatedWords} / {story.wordCount ?? "—"} слов</span><span>({achievedPercent}%)</span></div><ProgressBar value={maxProgress} label="Прочитанный текст" /></div>
        <article className="reader-article">
          {body !== null ? (
            <MarkdownViewer markdown={body} />
          ) : (
            <p className="reader-placeholder">{error ? "Не удалось загрузить рассказ." : "Загрузка…"}</p>
          )}
        </article>
        <div className="reader-meta"><BookOpenText size={16} aria-hidden="true" /> <span>{story.wordCount ?? "—"} слов</span><span>·</span><span>{story.subtitle}</span></div>
        <div className="reader-action"><button className={`primary-button ${completed ? "primary-button--completed" : ""}`} type="button" onClick={() => completeStory(story.id)} disabled={completed}>{completed && <Check size={17} weight="bold" />} {completed ? "Прочитано" : "Отметить прочитанным"}</button></div>
      </div>
    </ReaderShell>
  );
}
