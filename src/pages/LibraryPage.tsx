import { BookOpenText, Books, MagnifyingGlass, TextT, X } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, Navigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ContinueArrow, LessonRow, StoryRow } from "@/features/reading/components/ContentRow";
import { GrammarRow } from "@/features/grammar/components/GrammarRow";
import { grammarMatches, groupGrammarTopics } from "@/features/grammar/grammar";
import { grammarCategoryLabel } from "@/features/grammar/grammarLabels";
import { grammarContent, lessonContent, storyContent } from "@/lib/content";
import { completedLessonCount, completedStoryCount } from "@/features/reading/metrics";
import { useProgress } from "@/features/reading/useProgress";
import { ProgressBar } from "@/components/ui/ProgressBar";

const segments = [
  { id: "lessons", labelKey: "library.lessons" },
  { id: "stories", labelKey: "library.stories" },
  { id: "grammar", labelKey: "library.grammar" },
] as const;

type LibrarySection = (typeof segments)[number]["id"];

const sectionTitleKeys: Record<LibrarySection, "library.lessons" | "library.stories" | "library.grammar"> = {
  lessons: "library.lessons",
  stories: "library.stories",
  grammar: "library.grammar",
};

function isLibrarySection(value: string | undefined): value is LibrarySection {
  return value === "lessons" || value === "stories" || value === "grammar";
}

export function LibraryPage() {
  const { section } = useParams();

  if (section === undefined) {
    return <LibraryHome />;
  }

  if (!isLibrarySection(section)) {
    return <Navigate to="/library" replace />;
  }

  return <LibrarySectionView section={section} />;
}

function LibraryHome() {
  const { t } = useTranslation();
  const { progress } = useProgress();
  const lessonsDone = completedLessonCount(progress);
  const storiesDone = completedStoryCount(progress);

  return (
    <AppShell title={t("library.title")} className="library-shell library-shell--home">
      <div className="library-home-intro">
        <p className="eyebrow">{t("library.collectionsEyebrow")}</p>
        <p>{t("library.homeIntro")}</p>
      </div>

      <div className="library-collections" aria-label={t("library.sections")}>
        <Link to="/library/lessons" className="library-collection-card">
          <BookOpenText size={24} weight="regular" aria-hidden="true" />
          <div>
            <strong>{t("library.lessons")}</strong>
            <span>{t("library.lessonsProgress", { done: lessonsDone, total: lessonContent.length })}</span>
            <ProgressBar value={lessonContent.length ? lessonsDone / lessonContent.length : 0} />
          </div>
          <ContinueArrow />
        </Link>

        <Link to="/library/stories" className="library-collection-card">
          <Books size={24} weight="regular" aria-hidden="true" />
          <div>
            <strong>{t("library.stories")}</strong>
            <span>{t("library.storiesProgress", { done: storiesDone, total: storyContent.length })}</span>
            <ProgressBar value={storyContent.length ? storiesDone / storyContent.length : 0} />
          </div>
          <ContinueArrow />
        </Link>

        <Link to="/library/grammar" className="library-collection-card">
          <TextT size={24} weight="regular" aria-hidden="true" />
          <div>
            <strong>{t("library.grammar")}</strong>
            <span>{t("library.grammarCount", { count: grammarContent.length })}</span>
          </div>
          <ContinueArrow />
        </Link>
      </div>
    </AppShell>
  );
}

function LibrarySectionView({ section }: { section: LibrarySection }) {
  const { t } = useTranslation();
  const { getLessonStatus, getLessonPosition, getStoryProgress, getGrammarProgress } = useProgress();
  const [query, setQuery] = useState("");

  const visibleTopics = useMemo(
    () => (section === "grammar" ? grammarContent.filter((topic) => grammarMatches(topic, query)) : []),
    [section, query],
  );
  const grammarGroups = useMemo(
    () => (section === "grammar" ? groupGrammarTopics(visibleTopics) : []),
    [section, visibleTopics],
  );

  return (
    <AppShell title={t(sectionTitleKeys[section])} showBack backTo="/library" className="library-shell">
      <nav className="library-segments" aria-label={t("library.sections")}>
        {segments.map(({ id, labelKey }) => (
          <NavLink key={id} to={`/library/${id}`} className={({ isActive }) => (isActive ? "active" : undefined)}>
            {t(labelKey)}
          </NavLink>
        ))}
      </nav>

      {section === "lessons" && (
        <>
          <div className="list-intro">
            <p>{t("library.lessonsIntro", { count: lessonContent.length })}</p>
          </div>
          <div className="content-list">
            {lessonContent.map((lesson) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                status={getLessonStatus(lesson.id)}
                progress={getLessonPosition(lesson.id)}
              />
            ))}
          </div>
        </>
      )}

      {section === "stories" && (
        <>
          <div className="list-intro">
            <p>{t("library.storiesIntro")}</p>
          </div>
          <div className="content-list">
            {storyContent.map((story) => {
              const { resumePosition, completed } = getStoryProgress(story.id);
              return <StoryRow key={story.id} story={story} progress={resumePosition} completed={completed} />;
            })}
          </div>
        </>
      )}

      {section === "grammar" && (
        <>
          <div className="grammar-intro">
            <p className="eyebrow">{t("library.grammarEyebrow")}</p>
            <p>{t("library.grammarIntro")}</p>
          </div>

          <form className="grammar-search" role="search" onSubmit={(event) => event.preventDefault()}>
            <MagnifyingGlass size={18} aria-hidden="true" />
            <label className="sr-only" htmlFor="grammar-search-input">
              {t("library.searchLabel")}
            </label>
            <input
              id="grammar-search-input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("library.searchPlaceholder")}
              autoComplete="off"
            />
            {query && (
              <button type="button" className="grammar-search__clear" onClick={() => setQuery("")} aria-label={t("library.clearSearch")}>
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </form>

          <p className="grammar-results-count" aria-live="polite">
            {t("grammar.topicsCount", { count: visibleTopics.length })}
          </p>

          {grammarGroups.length > 0 ? (
            <div className="grammar-groups">
              {grammarGroups.map(({ category, topics }) => (
                <section className="grammar-category" key={category.id} aria-labelledby={`grammar-category-${category.id}`}>
                  <div className="grammar-category__heading">
                    <h2 id={`grammar-category-${category.id}`}>{grammarCategoryLabel(t, category.id)}</h2>
                    <span>{t("grammar.topicsCount", { count: topics.length })}</span>
                  </div>
                  <div className="grammar-topic-list">
                    {topics.map((topic) => (
                      <GrammarRow key={topic.id} topic={topic} progress={getGrammarProgress(topic.id)} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="grammar-empty" role="status">
              <strong>{t("library.emptyTitle")}</strong>
              <p>{t("library.emptyHint")}</p>
              <button type="button" className="outline-button" onClick={() => setQuery("")}>
                {t("library.showAllTopics")}
              </button>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
