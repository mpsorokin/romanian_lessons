import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { grammarContent } from "@/lib/content";
import { GrammarRow } from "@/features/grammar/components/GrammarRow";
import { grammarMatches, groupGrammarTopics, topicsCountLabel } from "@/features/grammar/grammar";

export function GrammarPage() {
  const [query, setQuery] = useState("");
  const visibleTopics = useMemo(() => grammarContent.filter((topic) => grammarMatches(topic, query)), [query]);
  const groups = useMemo(() => groupGrammarTopics(visibleTopics), [visibleTopics]);

  return (
    <AppShell title="Грамматика" showBack className="grammar-index-shell">
      <div className="grammar-intro">
        <p className="eyebrow">СПРАВОЧНИК</p>
        <p>Быстро находите правило, таблицу или конструкцию и возвращайтесь к чтению.</p>
      </div>

      <form className="grammar-search" role="search" onSubmit={(event) => event.preventDefault()}>
        <MagnifyingGlass size={18} aria-hidden="true" />
        <label className="sr-only" htmlFor="grammar-search-input">Найти правило</label>
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

      <p className="grammar-results-count" aria-live="polite">{topicsCountLabel(visibleTopics.length)}</p>

      {groups.length > 0 ? (
        <div className="grammar-groups">
          {groups.map(({ category, topics }) => (
            <section className="grammar-category" key={category.id} aria-labelledby={`grammar-category-${category.id}`}>
              <div className="grammar-category__heading">
                <h2 id={`grammar-category-${category.id}`}>{category.label}</h2>
                <span>{topicsCountLabel(topics.length)}</span>
              </div>
              <div className="grammar-topic-list">
                {topics.map((topic) => <GrammarRow key={topic.id} topic={topic} />)}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grammar-empty" role="status">
          <strong>Ничего не найдено</strong>
          <p>Попробуйте название на румынском, перевод или тег.</p>
          <button type="button" className="outline-button" onClick={() => setQuery("")}>Показать все темы</button>
        </div>
      )}
    </AppShell>
  );
}
