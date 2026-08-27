import { DarkShell } from "../components/PageShell";
import { StoryRow } from "../components/ContentRow";
import { storyContent } from "../lib/content";
import { useProgress } from "../features/progress/useProgress";

export function StoriesPage() {
  const { getStoryProgress } = useProgress();
  return (
    <DarkShell title="Рассказы" showBack className="list-shell">
      <div className="list-intro"><p>Читайте короткие истории и возвращайтесь к ним в удобном темпе.</p></div>
      <div className="content-list">
        {storyContent.map((story) => {
          const { maxProgress, completed } = getStoryProgress(story.id);
          return <StoryRow key={story.id} story={story} maxProgress={maxProgress} completed={completed} />;
        })}
      </div>
    </DarkShell>
  );
}
