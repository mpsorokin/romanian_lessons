import { BookOpenText, Check } from "@phosphor-icons/react";
import { useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { BackButton } from "@/components/ui/BackButton";

import { ReaderShell } from "@/components/layout/ReaderShell";
import { MarkdownViewer } from "@/features/reader/MarkdownViewer";
import { ReaderControls } from "@/features/reader/ReaderControls";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useProgressActions, useProgressState } from "@/features/reading/useProgress";
import { useReaderSettings } from "@/features/reader/ReaderSettingsProvider";
import { findContent } from "@/lib/content";
import { useContentBody } from "@/features/reader/useContentBody";
import { useReaderScroll } from "@/features/reader/useReaderScroll";
import { ReaderNotFoundPage } from "@/features/reading/pages/ReaderNotFoundPage";

export function StoryPage() {
  const { id = "" } = useParams();
  const story = findContent("story", id);
  const { settings } = useReaderSettings();
  const { getProgressSnapshot, saveStoryPosition } = useProgressActions();
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
        <StoryProgressTop storyId={story.id} wordCount={story.wordCount} />
        <article className="reader-article">
          {body !== null ? (
            <MarkdownViewer markdown={body} />
          ) : (
            <p className="reader-placeholder">{error ? "Не удалось загрузить рассказ." : "Загрузка…"}</p>
          )}
        </article>
        <div className="reader-meta"><BookOpenText size={16} aria-hidden="true" /> <span>{story.wordCount ?? "—"} слов</span><span>·</span><span>{story.subtitle}</span></div>
        <StoryCompleteAction storyId={story.id} />
      </div>
    </ReaderShell>
  );
}

function StoryProgressTop({ storyId, wordCount }: { storyId: string; wordCount?: number }) {
  const progress = useProgressState();
  const entry = progress.stories[storyId];
  const maxProgress = entry?.maxProgress ?? 0;
  const achievedPercent = Math.round(maxProgress * 100);
  const estimatedWords = Math.round((wordCount ?? 0) * maxProgress);

  return (
    <div className="story-progress-top">
      <div><span>{estimatedWords} / {wordCount ?? "—"} слов</span><span>({achievedPercent}%)</span></div>
      <ProgressBar value={maxProgress} label="Прочитанный текст" />
    </div>
  );
}

function StoryCompleteAction({ storyId }: { storyId: string }) {
  const { completeStory } = useProgressActions();
  const progress = useProgressState();
  const completed = progress.stories[storyId]?.completed ?? false;

  return (
    <div className="reader-action">
      <button className={`primary-button ${completed ? "primary-button--completed" : ""}`} type="button" onClick={() => completeStory(storyId)} disabled={completed}>
        {completed && <Check size={17} weight="bold" />} {completed ? "Прочитано" : "Отметить прочитанным"}
      </button>
    </div>
  );
}
