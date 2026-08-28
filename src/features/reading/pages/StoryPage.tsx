import { BookOpenText, Check } from "@phosphor-icons/react";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { BackButton } from "@/components/ui/BackButton";

import { ReaderShell } from "@/components/layout/ReaderShell";
import { MarkdownViewer } from "@/features/reader/MarkdownViewer";
import { ReaderControls } from "@/features/reader/ReaderControls";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useProgressActions } from "@/features/reading/useProgress";
import { useReaderSettings } from "@/features/reader/ReaderSettingsProvider";
import { findContent } from "@/lib/content";
import { useContentBody } from "@/features/reader/useContentBody";
import { useReaderScroll } from "@/features/reader/useReaderScroll";
import { ReaderNotFoundPage } from "@/features/reading/pages/ReaderNotFoundPage";

export function StoryPage() {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const story = findContent("story", id);
  const { settings } = useReaderSettings();
  const { getProgressSnapshot, saveStoryPosition, syncProgressState } = useProgressActions();
  const { body, error } = useContentBody(story);

  const initial = useRef<{ id: string; position: number; maxProgress: number; completed: boolean } | null>(null);
  if (story && initial.current?.id !== story.id) {
    const entry = getProgressSnapshot().stories[story.id];
    initial.current = {
      id: story.id,
      position: entry?.resumePosition ?? 0,
      maxProgress: entry?.maxProgress ?? 0,
      completed: entry?.completed ?? false,
    };
  }
  const initialPosition = initial.current?.position ?? 0;
  const initialMaxProgress = initial.current?.maxProgress ?? 0;
  const initialCompleted = initial.current?.completed ?? false;

  const [live, setLive] = useState({
    id: story?.id ?? "",
    progress: initialMaxProgress,
    completed: initialCompleted,
  });
  if (story && live.id !== story.id) {
    setLive({ id: story.id, progress: initialMaxProgress, completed: initialCompleted });
  }

  const savePosition = useCallback(
    (position: number, options?: { force?: boolean }) => {
      setLive((prev) => {
        if (prev.completed || position >= 0.96) {
          return { ...prev, progress: 1, completed: true };
        }
        return { ...prev, progress: position };
      });
      if (story) saveStoryPosition(story.id, position, position, options);
    },
    [story, saveStoryPosition],
  );

  const scrollRef = useReaderScroll(
    story?.id ?? "missing",
    initialPosition,
    savePosition,
    body !== null,
    syncProgressState,
  );

  if (!story) return <ReaderNotFoundPage kind="story" />;

  return (
    <ReaderShell theme={settings.theme} className="reader-shell--story">
      <header className="reader-header">
        <BackButton to="/library/stories" />
        <div className="reader-header__title">
          <span>
            {t("reader.storyHeader", { order: String(story.order).padStart(2, "0"), level: story.level ?? "A1" })}
          </span>
          <strong>{story.title}</strong>
        </div>
        <ReaderControls />
      </header>
      <div
        className="reader-scroll"
        ref={scrollRef}
        style={{ "--reader-size": `${settings.fontSize}px`, "--reader-line-height": settings.lineHeight } as React.CSSProperties}
      >
        <StoryProgressTop maxProgress={live.progress} wordCount={story.wordCount} />
        <article className="reader-article">
          {body !== null ? (
            <MarkdownViewer markdown={body} />
          ) : (
            <p className="reader-placeholder">{error ? t("reader.loadStoryError") : t("common.loading")}</p>
          )}
        </article>
        <div className="reader-meta">
          <BookOpenText size={16} aria-hidden="true" />{" "}
          <span>{story.wordCount ? t("reader.wordCount", { count: story.wordCount }) : "—"}</span>
          <span>·</span>
          <span>{story.subtitle}</span>
        </div>
        <StoryCompleteAction
          storyId={story.id}
          completed={live.completed}
          onCompleted={() => setLive((prev) => ({ ...prev, progress: 1, completed: true }))}
        />
      </div>
    </ReaderShell>
  );
}

function StoryProgressTop({ maxProgress, wordCount }: { maxProgress: number; wordCount?: number }) {
  const { t } = useTranslation();
  const achievedPercent = Math.round(maxProgress * 100);
  const estimatedWords = Math.round((wordCount ?? 0) * maxProgress);

  return (
    <div className="story-progress-top">
      <div>
        <span>{t("reader.wordsReadProgress", { read: estimatedWords, total: wordCount ?? "—" })}</span>
        <span>({achievedPercent}%)</span>
      </div>
      <ProgressBar value={maxProgress} label={t("reader.readText")} />
    </div>
  );
}

function StoryCompleteAction({
  storyId,
  completed,
  onCompleted,
}: {
  storyId: string;
  completed: boolean;
  onCompleted: () => void;
}) {
  const { t } = useTranslation();
  const { completeStory } = useProgressActions();

  const handleComplete = () => {
    completeStory(storyId);
    onCompleted();
  };

  return (
    <div className="reader-action">
      <button className={`primary-button ${completed ? "primary-button--completed" : ""}`} type="button" onClick={handleComplete} disabled={completed}>
        {completed && <Check size={17} weight="bold" />} {completed ? t("reader.read") : t("reader.markRead")}
      </button>
    </div>
  );
}
