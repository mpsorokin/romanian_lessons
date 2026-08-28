import { BookOpenText, Books, CardsThree, TextT } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ContinueArrow } from "@/features/reading/components/ContentRow";
import { AppShell } from "@/components/layout/AppShell";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { lessonContent, storyContent } from "@/lib/content";
import { completedLessonCount, completedStoryCount, getActiveStory, getNextLesson } from "@/features/reading/metrics";
import { useProgress } from "@/features/reading/useProgress";
import { useCardProgressState } from "@/features/cards/useCardProgress";
import { getTotalCardProgress } from "@/features/cards/cardStats";

export function OverviewPage() {
  const { t } = useTranslation();
  const { progress, getStoryProgress } = useProgress();
  const cardProgress = useCardProgressState();
  const completedLessons = completedLessonCount(progress);
  const completedStories = completedStoryCount(progress);
  const cardsDone = getTotalCardProgress(cardProgress);
  const nextLesson = getNextLesson(lessonContent, progress);
  const activeStory = getActiveStory(storyContent, progress);

  return (
    <AppShell className="dashboard-shell">
      <section className="continue-card" aria-label={t("overview.continueLearning")}>
        <p className="eyebrow">{t("overview.continueEyebrow")}</p>
        {nextLesson ? (
          <Link to={`/lessons/${nextLesson.id}`} className="continue-card__link">
            <div>
              <h3>{nextLesson.title}</h3>
              <p>
                {t("overview.lessonHeader", {
                  order: String(nextLesson.order).padStart(2, "0"),
                  level: nextLesson.level ?? "A1",
                })}
              </p>
            </div>
            <span className="outline-button">
              {t("common.continue")} <ContinueArrow />
            </span>
          </Link>
        ) : (
          <p className="empty-copy">{t("overview.allLessonsDone")}</p>
        )}
        {nextLesson && (
          <ProgressBar
            value={progress.lessons[nextLesson.id]?.resumePosition ?? 0}
            label={t("overview.lessonResumePosition")}
          />
        )}
      </section>

      {activeStory && (
        <Link to={`/stories/${activeStory.id}`} className="resume-story-row" aria-label={t("overview.continueStory")}>
          <div>
            <p className="eyebrow">{t("overview.continueReadingEyebrow")}</p>
            <strong>{activeStory.title}</strong>
            <span>{t("overview.percentRead", { percent: Math.round(getStoryProgress(activeStory.id).maxProgress * 100) })}</span>
          </div>
          <ContinueArrow />
        </Link>
      )}

      <section className="launcher-grid" aria-label={t("overview.appSections")}>
        <Link to="/library/lessons" className="launcher-card">
          <BookOpenText size={24} weight="regular" aria-hidden="true" />
          <div>
            <p className="eyebrow">{t("overview.lessonsEyebrow")}</p>
            <strong>
              {completedLessons} <span>/ {lessonContent.length}</span>
            </strong>
            <small>{t("overview.lessonsDone")}</small>
          </div>
          <ProgressBar value={lessonContent.length ? completedLessons / lessonContent.length : 0} />
        </Link>
        <Link to="/library/stories" className="launcher-card">
          <Books size={24} weight="regular" aria-hidden="true" />
          <div>
            <p className="eyebrow">{t("overview.storiesEyebrow")}</p>
            <strong>
              {completedStories} <span>/ {storyContent.length}</span>
            </strong>
            <small>{t("overview.storiesDone")}</small>
          </div>
          <ProgressBar value={storyContent.length ? completedStories / storyContent.length : 0} />
        </Link>
        <Link to="/cards" className="launcher-card">
          <CardsThree size={24} weight="regular" aria-hidden="true" />
          <div>
            <p className="eyebrow">{t("overview.cardsEyebrow")}</p>
            <strong>
              {cardsDone.known} <span>/ {cardsDone.total}</span>
            </strong>
            <small>{t("overview.cardsDone")}</small>
          </div>
          <ProgressBar value={cardsDone.percent} />
        </Link>
        <Link to="/library/grammar" className="launcher-card">
          <TextT size={24} weight="regular" aria-hidden="true" />
          <div>
            <p className="eyebrow">{t("overview.grammarEyebrow")}</p>
            <strong>{t("overview.grammarTitle")}</strong>
            <small>{t("overview.grammarSubtitle")}</small>
          </div>
        </Link>
      </section>
    </AppShell>
  );
}
