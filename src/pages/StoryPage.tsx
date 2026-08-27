import { BookOpenText, Check } from "@phosphor-icons/react";
import { useCallback } from "react";
import { useParams } from "react-router-dom";
import { BackButton, ReaderShell } from "../components/PageShell";
import { MarkdownViewer } from "../components/MarkdownViewer";
import { ReaderControls } from "../components/ReaderControls";
import { ProgressBar } from "../components/ProgressBar";
import { useProgress } from "../features/progress/useProgress";
import { useReaderSettings } from "../features/reader-settings/ReaderSettingsProvider";
import { findContent } from "../lib/content";
import { useReaderScroll } from "../hooks/useReaderScroll";
import { ReaderNotFoundPage } from "./ReaderNotFoundPage";

export function StoryPage() {
  const { id = "" } = useParams();
  const story = findContent("story", id);
  const { settings } = useReaderSettings();
  const { getStoryProgress, saveStoryPosition, completeStory } = useProgress();
  const storyProgress = story ? getStoryProgress(story.id) : { maxProgress: 0, resumePosition: 0, completed: false };
  const savePosition = useCallback((position: number) => {
    if (story) saveStoryPosition(story.id, position, position);
  }, [story, saveStoryPosition]);
  const scrollRef = useReaderScroll(story?.id ?? "missing", storyProgress.resumePosition, savePosition);

  if (!story || story.type !== "story") return <ReaderNotFoundPage kind="рассказ" />;
  const achievedPercent = Math.round(storyProgress.maxProgress * 100);
  const estimatedWords = Math.round((story.wordCount ?? 0) * storyProgress.maxProgress);

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
        <div className="story-progress-top"><div><span>{estimatedWords} / {story.wordCount ?? "—"} слов</span><span>({achievedPercent}%)</span></div><ProgressBar value={storyProgress.maxProgress} label="Прочитанный текст" /></div>
        <article className="reader-article"><MarkdownViewer markdown={story.markdown} /></article>
        <div className="reader-meta"><BookOpenText size={16} aria-hidden="true" /> <span>{story.wordCount ?? "—"} слов</span><span>·</span><span>{story.subtitle}</span></div>
        <div className="reader-action"><button className={`primary-button ${storyProgress.completed ? "primary-button--completed" : ""}`} type="button" onClick={() => completeStory(story.id)} disabled={storyProgress.completed}>{storyProgress.completed && <Check size={17} weight="bold" />} {storyProgress.completed ? "Прочитано" : "Отметить прочитанным"}</button></div>
      </div>
    </ReaderShell>
  );
}
