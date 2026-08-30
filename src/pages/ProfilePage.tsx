import { ArrowRight, BookOpenText, Books, CardsThree, Gear, Stack } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { lessonContent, storyContent, allContent, getCurrentLevel } from "@/lib/content";
import {
  averageStoryLength,
  completedLessonCount,
  completedMaterialCount,
  completedStoryCount,
  estimatedWordsRead,
  getLastTouched,
  overallProgress,
} from "@/features/progress/metrics";
import { useProgress } from "@/features/progress/useProgress";
import { useCardProgressState } from "@/features/cards/useCardProgress";
import { getTotalCardProgress } from "@/features/cards/cardStats";

export function ProfilePage() {
  const { t } = useTranslation();
  const { progress } = useProgress();
  const cardProgress = useCardProgressState();
  const lessonsDone = completedLessonCount(progress);
  const storiesDone = completedStoryCount(progress);
  const materialsDone = completedMaterialCount(progress);
  const courseProgress = overallProgress(progress, allContent);
  const cardsDone = getTotalCardProgress(cardProgress);
  const lastLesson = getLastTouched(lessonContent, progress, "lesson");
  const lastStory = getLastTouched(storyContent, progress, "story");

  return (
    <AppShell title={t("profile.title")} className="profile-shell">
      <section className="profile-identity">
        <div className="avatar-mark">C</div>
        <div>
          <h2>{t("profile.localProfile")}</h2>
          <p>
            {t("profile.welcome")}
            <br />
            {t("profile.welcomeTo")}
          </p>
        </div>
      </section>

      <section className="dark-card profile-progress-card">
        <p className="eyebrow">{t("profile.courseProgressEyebrow")}</p>
        <div className="profile-progress-top">
          <ProgressRing value={courseProgress} label={t("profile.overallProgress")} />
          <div>
            <strong>{t("profile.overallProgress")}</strong>
            <span>{t("profile.materialsProgress", { done: materialsDone, total: allContent.length })}</span>
            <ProgressBar value={courseProgress} />
          </div>
        </div>
        <div className="profile-stat-row">
          <BookOpenText size={19} />
          <span>{t("profile.lessonsCompleted")}</span>
          <strong>{t("profile.ofTotal", { done: lessonsDone, total: lessonContent.length })}</strong>
        </div>
        <div className="profile-stat-row">
          <Books size={19} />
          <span>{t("profile.storiesRead")}</span>
          <strong>{t("profile.ofTotal", { done: storiesDone, total: storyContent.length })}</strong>
        </div>
        <div className="profile-stat-row">
          <CardsThree size={19} />
          <span>{t("profile.cardsMastered")}</span>
          <strong>{t("profile.ofTotal", { done: cardsDone.known, total: cardsDone.total })}</strong>
        </div>
        <div className="profile-stat-row">
          <Stack size={19} />
          <span>{t("profile.currentLevel")}</span>
          <strong>{getCurrentLevel()}</strong>
        </div>
      </section>

      <section className="stats-section profile-details-section">
        <p className="eyebrow">{t("profile.detailsEyebrow")}</p>
        <div className="dark-card detail-card">
          <DetailRow label={t("profile.lastLesson")} value={lastLesson?.title ?? t("common.noneYet")} to={lastLesson ? `/lessons/${lastLesson.id}` : undefined} />
          <DetailRow label={t("profile.lastStory")} value={lastStory?.title ?? t("common.noneYet")} to={lastStory ? `/stories/${lastStory.id}` : undefined} />
          <DetailRow label={t("profile.avgStoryLength")} value={t("common.words", { count: averageStoryLength(storyContent) })} />
          <DetailRow label={t("profile.estimatedRead")} value={t("common.words", { count: estimatedWordsRead(storyContent, progress) })} />
        </div>
      </section>

      <div className="profile-links">
        <Link to="/settings">
          <span>
            <Gear size={18} /> {t("profile.settingsLink")}
          </span>
          <ArrowRight size={17} />
        </Link>
      </div>
    </AppShell>
  );
}

function DetailRow({ label, value, to }: { label: string; value: string; to?: string }) {
  const content = (
    <>
      <span>{label}</span>
      <strong>{value}</strong>
      {to && <ArrowRight size={16} />}
    </>
  );
  return to ? (
    <Link className="detail-row" to={to}>
      {content}
    </Link>
  ) : (
    <div className="detail-row">{content}</div>
  );
}
