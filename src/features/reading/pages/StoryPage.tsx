import { BookOpenText, Check } from "@phosphor-icons/react";
import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const story = findContent("story", id);
  const { settings } = useReaderSettings();
  const { getProgressSnapshot, saveStoryPosition } = useProgressActions();
  const { body, error } = useContentBody(story);

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
        <StoryProgressTop storyId={story.id} wordCount={story.wordCount} />
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
        <StoryCompleteAction storyId={story.id} />
      </div>
    </ReaderShell>
  );
}

function StoryProgressTop({ storyId, wordCount }: { storyId: string; wordCount?: number }) {
  const { t } = useTranslation();
  const progress = useProgressState();
  const entry = progress.stories[storyId];
  const maxProgress = entry?.maxProgress ?? 0;
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

function StoryCompleteAction({ storyId }: { storyId: string }) {
  const { t } = useTranslation();
  const { completeStory } = useProgressActions();
  const progress = useProgressState();
  const completed = progress.stories[storyId]?.completed ?? false;

  return (
    <div className="reader-action">
      <button className={`primary-button ${completed ? "primary-button--completed" : ""}`} type="button" onClick={() => completeStory(storyId)} disabled={completed}>
        {completed && <Check size={17} weight="bold" />} {completed ? t("reader.read") : t("reader.markRead")}
      </button>
    </div>
  );
}
