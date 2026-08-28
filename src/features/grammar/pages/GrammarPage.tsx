import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/layout/AppShell";
import { grammarContent } from "@/lib/content";
import { GrammarRow } from "@/features/grammar/components/GrammarRow";
import { grammarMatches, groupGrammarTopics } from "@/features/grammar/grammar";
import { grammarCategoryLabel } from "@/features/grammar/grammarLabels";
import { useProgress } from "@/features/reading/useProgress";

export function GrammarPage() {
  const { t } = useTranslation();
  const { getGrammarProgress } = useProgress();
  const [query, setQuery] = useState("");
  const visibleTopics = useMemo(() => grammarContent.filter((topic) => grammarMatches(topic, query)), [query]);
  const groups = useMemo(() => groupGrammarTopics(visibleTopics), [visibleTopics]);

  return (
    <AppShell title={t("library.grammar")} showBack className="grammar-index-shell">
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

      {groups.length > 0 ? (
        <div className="grammar-groups">
          {groups.map(({ category, topics }) => (
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
    </AppShell>
  );
}
