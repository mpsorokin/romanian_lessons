import { ArrowRight } from "@phosphor-icons/react";
import { Link, useParams } from "react-router-dom";
import { BackButton } from "@/components/ui/BackButton";
import { ReaderShell } from "@/components/layout/ReaderShell";
import { MarkdownViewer } from "@/features/reader/MarkdownViewer";
import { ReaderControls } from "@/features/reader/ReaderControls";
import { useReaderSettings } from "@/features/reader/ReaderSettingsProvider";
import { useContentBody } from "@/features/reader/useContentBody";
import { findContent } from "@/lib/content";
import { getGrammarCategory } from "@/features/grammar/grammar";
import { ReaderNotFoundPage } from "@/features/reading/pages/ReaderNotFoundPage";

export function GrammarArticlePage() {
  const { id = "" } = useParams();
  const topic = findContent("grammar", id);
  const { settings } = useReaderSettings();
  const { body, error } = useContentBody(topic);

  if (!topic) return <ReaderNotFoundPage kind="топик грамматики" />;

  return (
    <ReaderShell theme={settings.theme} className="reader-shell--grammar">
      <header className="reader-header">
        <BackButton to="/grammar" label="К списку грамматики" />
        <div className="reader-header__title">
          <span>{getGrammarCategory(topic.category).label} · {topic.level ?? "A1"}</span>
          <strong>{topic.title}</strong>
        </div>
        <ReaderControls />
      </header>
      <div
        className="reader-scroll"
        style={{ "--reader-size": `${settings.fontSize}px`, "--reader-line-height": settings.lineHeight } as React.CSSProperties}
      >
        <article className="reader-article grammar-reader-article">
          {topic.subtitle && <p className="grammar-article-subtitle">{topic.subtitle}</p>}
          {body !== null ? (
            <MarkdownViewer markdown={body} variant="grammar" />
          ) : (
            <p className="reader-placeholder">{error ? "Не удалось загрузить раздел грамматики." : "Загрузка…"}</p>
          )}
          <RelatedTopics topicId={topic.id} relatedIds={topic.related ?? []} />
        </article>
      </div>
    </ReaderShell>
  );
}

function RelatedTopics({ topicId, relatedIds }: { topicId: string; relatedIds: string[] }) {
  const related = relatedIds
    .filter((relatedId) => relatedId !== topicId)
    .map((relatedId) => findContent("grammar", relatedId))
    .filter((topic): topic is NonNullable<typeof topic> => Boolean(topic));

  if (related.length === 0) return null;

  return (
    <section className="grammar-related" aria-labelledby="grammar-related-heading">
      <h2 id="grammar-related-heading">Связанные темы</h2>
      <div className="grammar-related__list">
        {related.map((topic) => (
          <Link className="grammar-related__link" key={topic.id} to={`/grammar/${topic.id}`}>
            <span><strong>{topic.title}</strong>{topic.subtitle && <small>{topic.subtitle}</small>}</span>
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}
