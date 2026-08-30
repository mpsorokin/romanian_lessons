import { BookOpenText, Check } from "@phosphor-icons/react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { BackButton } from "@/components/ui/BackButton";

import { ReaderShell } from "@/components/layout/ReaderShell";
import { MarkdownViewer } from "@/features/reader/MarkdownViewer";
import { ReaderControls } from "@/features/reader/ReaderControls";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useProgressActions } from "@/features/progress/useProgress";
import { useReaderSettings } from "@/features/reader/ReaderSettingsProvider";
import { findContent } from "@/lib/content";
import { ReaderScrollArea } from "@/features/reader/ReaderScrollArea";
import { useContentBody } from "@/features/reader/useContentBody";
import { useContentSnapshot } from "@/features/reader/useContentSnapshot";
import { useReaderScroll } from "@/features/reader/useReaderScroll";
import { ReaderNotFoundPage } from "@/features/reading/pages/ReaderNotFoundPage";

export function StoryPage() {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const story = findContent("story", id);
  const { settings } = useReaderSettings();
  const { getProgressSnapshot, saveStoryPosition, syncProgressState } = useProgressActions();
  const { body, error } = useContentBody(story);

  const initial = useContentSnapshot(story?.id, (id) => {
    const entry = getProgressSnapshot().stories[id];
    return { position: entry?.resumePosition ?? 0, completed: entry?.completed ?? false };
  });
  const initialPosition = initial?.position ?? 0;
  const initialCompleted = initial?.completed ?? false;

  const [live, setLive] = useState({
    id: story?.id ?? "",
    progress: initialPosition,
    completed: initialCompleted,
  });
  if (story && live.id !== story.id) {
    setLive({ id: story.id, progress: initialPosition, completed: initialCompleted });
  }

  const savePosition = useCallback(
    (position: number, options?: { force?: boolean }) => {
      setLive((prev) => {
        if (prev.completed) return prev;
        return { ...prev, progress: position };
      });
      if (story) saveStoryPosition(story.id, position, options);
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
      <ReaderScrollArea settings={settings} scrollRef={scrollRef}>
        {!live.completed && <StoryProgressTop progress={live.progress} wordCount={story.wordCount} />}
        <article className="reader-article">
          {body !== null ? (
            <MarkdownViewer markdown={body} variant="story" />
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
          scrollRef={scrollRef}
          onCompleted={() => setLive((prev) => ({ ...prev, progress: 1, completed: true }))}
          onReset={() => setLive({ id: story.id, progress: 0, completed: false })}
        />
      </ReaderScrollArea>
    </ReaderShell>
  );
}

function StoryProgressTop({ progress, wordCount }: { progress: number; wordCount?: number }) {
  const { t } = useTranslation();
  const achievedPercent = Math.round(progress * 100);
  const estimatedWords = Math.round((wordCount ?? 0) * progress);

  return (
    <div className="story-progress-top">
      <div>
        <span>{t("reader.wordsReadProgress", { read: estimatedWords, total: wordCount ?? "—" })}</span>
        <span>({achievedPercent}%)</span>
      </div>
      <ProgressBar value={progress} label={t("reader.readText")} />
    </div>
  );
}

function StoryCompleteAction({
  storyId,
  completed,
  scrollRef,
  onCompleted,
  onReset,
}: {
  storyId: string;
  completed: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onCompleted: () => void;
  onReset: () => void;
}) {
  const { t } = useTranslation();
  const { completeStory, resetStory } = useProgressActions();

  const handleComplete = () => {
    completeStory(storyId);
    onCompleted();
  };

  const handleReset = () => {
    resetStory(storyId);
    onReset();
    scrollRef.current?.scrollTo({ top: 0 });
  };

  return (
    <div className="reader-action">
      <button className={`primary-button ${completed ? "primary-button--completed" : ""}`} type="button" onClick={handleComplete} disabled={completed}>
        {completed && <Check size={17} weight="bold" />} {completed ? t("reader.read") : t("reader.markRead")}
      </button>
      {completed && (
        <button className="reader-secondary-button" type="button" onClick={handleReset}>
          {t("reader.markStoryNew")}
        </button>
      )}
    </div>
  );
}
