import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { NavLink, Navigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { LessonRow, StoryRow } from "@/features/reading/components/ContentRow";
import { GrammarRow } from "@/features/grammar/components/GrammarRow";
import { grammarMatches, groupGrammarTopics, topicsCountLabel } from "@/features/grammar/grammar";
import { grammarContent, lessonContent, storyContent } from "@/lib/content";
import { useProgress } from "@/features/reading/useProgress";

const segments = [
  { id: "lessons", label: "Уроки" },
  { id: "stories", label: "Рассказы" },
  { id: "grammar", label: "Грамматика" },
] as const;

type LibrarySection = (typeof segments)[number]["id"];

function isLibrarySection(value: string | undefined): value is LibrarySection {
  return value === "lessons" || value === "stories" || value === "grammar";
}

export function LibraryPage() {
  const { section } = useParams();
  const { getLessonStatus, getStoryProgress } = useProgress();
  const [query, setQuery] = useState("");
  const activeSection = isLibrarySection(section) ? section : "lessons";

  const visibleTopics = useMemo(
    () => (activeSection === "grammar" ? grammarContent.filter((topic) => grammarMatches(topic, query)) : []),
    [activeSection, query],
  );
  const grammarGroups = useMemo(
    () => (activeSection === "grammar" ? groupGrammarTopics(visibleTopics) : []),
    [activeSection, visibleTopics],
  );

  if (!isLibrarySection(section)) {
    return <Navigate to="/library/lessons" replace />;
  }

  return (
    <AppShell title="Библиотека" className="library-shell">
      <nav className="library-segments" aria-label="Разделы библиотеки">
        {segments.map(({ id, label }) => (
          <NavLink key={id} to={`/library/${id}`} className={({ isActive }) => (isActive ? "active" : undefined)}>
            {label}
          </NavLink>
        ))}
      </nav>

      {section === "lessons" && (
        <>
          <div className="list-intro">
            <p>{lessonContent.length} небольших уроков о языке и жизни в Румынии.</p>
          </div>
          <div className="content-list">
            {lessonContent.map((lesson) => (
              <LessonRow key={lesson.id} lesson={lesson} status={getLessonStatus(lesson.id)} />
            ))}
          </div>
        </>
      )}

      {section === "stories" && (
        <>
          <div className="list-intro">
            <p>Читайте короткие истории и возвращайтесь к ним в удобном темпе.</p>
          </div>
          <div className="content-list">
            {storyContent.map((story) => {
              const { maxProgress, completed } = getStoryProgress(story.id);
              return <StoryRow key={story.id} story={story} maxProgress={maxProgress} completed={completed} />;
            })}
          </div>
        </>
      )}

      {section === "grammar" && (
        <>
          <div className="grammar-intro">
            <p className="eyebrow">СПРАВОЧНИК</p>
            <p>Быстро находите правило, таблицу или конструкцию и возвращайтесь к чтению.</p>
          </div>

          <form className="grammar-search" role="search" onSubmit={(event) => event.preventDefault()}>
            <MagnifyingGlass size={18} aria-hidden="true" />
            <label className="sr-only" htmlFor="grammar-search-input">
              Найти правило
            </label>
            <input
              id="grammar-search-input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Найти правило или тег"
              autoComplete="off"
            />
            {query && (
              <button type="button" className="grammar-search__clear" onClick={() => setQuery("")} aria-label="Очистить поиск">
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </form>

          <p className="grammar-results-count" aria-live="polite">
            {topicsCountLabel(visibleTopics.length)}
          </p>

          {grammarGroups.length > 0 ? (
            <div className="grammar-groups">
              {grammarGroups.map(({ category, topics }) => (
                <section className="grammar-category" key={category.id} aria-labelledby={`grammar-category-${category.id}`}>
                  <div className="grammar-category__heading">
                    <h2 id={`grammar-category-${category.id}`}>{category.label}</h2>
                    <span>{topicsCountLabel(topics.length)}</span>
                  </div>
                  <div className="grammar-topic-list">
                    {topics.map((topic) => (
                      <GrammarRow key={topic.id} topic={topic} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="grammar-empty" role="status">
              <strong>Ничего не найдено</strong>
              <p>Попробуйте название на румынском, перевод или тег.</p>
              <button type="button" className="outline-button" onClick={() => setQuery("")}>
                Показать все темы
              </button>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
