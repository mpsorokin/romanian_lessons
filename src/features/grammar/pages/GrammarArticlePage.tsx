import { ArrowRight } from "@phosphor-icons/react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { BackButton } from "@/components/ui/BackButton";
import { ReaderShell } from "@/components/layout/ReaderShell";
import { MarkdownViewer } from "@/features/reader/MarkdownViewer";
import { ReaderControls } from "@/features/reader/ReaderControls";
import { useReaderSettings } from "@/features/reader/ReaderSettingsProvider";
import { ReaderScrollArea } from "@/features/reader/ReaderScrollArea";
import { useContentBody } from "@/features/reader/useContentBody";
import { useContentSnapshot } from "@/features/reader/useContentSnapshot";
import { useReaderScroll } from "@/features/reader/useReaderScroll";
import { useProgressActions } from "@/features/progress/useProgress";
import { findContent } from "@/lib/content";
import { getGrammarCategory } from "@/features/grammar/grammar";
import { grammarCategoryLabel } from "@/features/grammar/grammarLabels";
import { ReaderNotFoundPage } from "@/features/reading/pages/ReaderNotFoundPage";

export function GrammarArticlePage() {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const topic = findContent("grammar", id);
  const { settings } = useReaderSettings();
  const { getProgressSnapshot, saveGrammarPosition, syncProgressState } = useProgressActions();
  const { body, error } = useContentBody(topic);

  const initialPosition =
    useContentSnapshot(topic?.id, (id) => getProgressSnapshot().grammar[id]?.resumePosition ?? 0) ?? 0;

  const savePosition = useCallback(
    (position: number, options?: { force?: boolean }) => {
      if (topic) saveGrammarPosition(topic.id, position, options);
    },
    [topic, saveGrammarPosition],
  );

  const scrollRef = useReaderScroll(topic?.id ?? "missing", initialPosition, savePosition, body !== null, syncProgressState);

  if (!topic) return <ReaderNotFoundPage kind="grammar" />;

  const category = getGrammarCategory(topic.category);

  return (
    <ReaderShell theme={settings.theme} className="reader-shell--grammar">
      <header className="reader-header">
        <BackButton to="/library/grammar" label={t("reader.backToGrammar")} />
        <div className="reader-header__title">
          <span>
            {grammarCategoryLabel(t, category.id)} · {topic.level ?? "A1"}
          </span>
          <strong>{topic.title}</strong>
        </div>
        <ReaderControls />
      </header>
      <ReaderScrollArea settings={settings} scrollRef={scrollRef}>
        <article className="reader-article grammar-reader-article">
          {topic.subtitle && <p className="grammar-article-subtitle">{topic.subtitle}</p>}
          {body !== null ? (
            <MarkdownViewer markdown={body} variant="grammar" />
          ) : (
            <p className="reader-placeholder">{error ? t("reader.loadGrammarError") : t("common.loading")}</p>
          )}
          <RelatedTopics topicId={topic.id} relatedIds={topic.related ?? []} />
        </article>
      </ReaderScrollArea>
    </ReaderShell>
  );
}

function RelatedTopics({ topicId, relatedIds }: { topicId: string; relatedIds: string[] }) {
  const { t } = useTranslation();
  const related = relatedIds
    .filter((relatedId) => relatedId !== topicId)
    .map((relatedId) => findContent("grammar", relatedId))
    .filter((topic): topic is NonNullable<typeof topic> => Boolean(topic));

  if (related.length === 0) return null;

  return (
    <section className="grammar-related" aria-labelledby="grammar-related-heading">
      <h2 id="grammar-related-heading">{t("reader.relatedTopics")}</h2>
      <div className="grammar-related__list">
        {related.map((topic) => (
          <Link className="grammar-related__link" key={topic.id} to={`/grammar/${topic.id}`}>
            <span>
              <strong>{topic.title}</strong>
              {topic.subtitle && <small>{topic.subtitle}</small>}
            </span>
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}
