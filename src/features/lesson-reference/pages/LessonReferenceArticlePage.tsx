import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { BackButton } from "@/components/ui/BackButton";
import { ReaderShell } from "@/components/layout/ReaderShell";
import { ReaderControls } from "@/features/reader/ReaderControls";
import { MarkdownViewer } from "@/features/reader/MarkdownViewer";
import { useReaderSettings } from "@/features/reader/ReaderSettingsProvider";
import { ReaderScrollArea } from "@/features/reader/ReaderScrollArea";
import { useContentBody } from "@/features/reader/useContentBody";
import { ReaderNotFoundPage } from "@/features/reading/pages/ReaderNotFoundPage";
import { LessonWordsTable } from "@/features/lesson-reference/components/LessonWordsTable";
import { findContent } from "@/lib/content";

export function LessonReferenceArticlePage() {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const reference = findContent("lesson-reference", id);
  const { settings } = useReaderSettings();
  const { body, error } = useContentBody(reference);

  if (!reference) return <ReaderNotFoundPage kind="lesson-reference" />;

  const lesson = findContent("lesson", reference.lessonId);
  const order = lesson?.order ?? reference.order;

  return (
    <ReaderShell theme={settings.theme} className="reader-shell--grammar lesson-reference-reader">
      <header className="reader-header">
        <BackButton to="/lessons-ref" label={t("lessonReference.backToList")} />
        <div className="reader-header__title">
          <span>
            {t("lessonReference.lessonLabel", { order: String(order).padStart(2, "0") })} · {reference.level ?? "A1"}
          </span>
          <strong>{reference.title}</strong>
        </div>
        <ReaderControls />
      </header>
      <ReaderScrollArea settings={settings}>
        <article className="reader-article grammar-reader-article lesson-reference-article">
          {reference.subtitle && <p className="grammar-article-subtitle">{reference.subtitle}</p>}
          {body !== null ? (
            <MarkdownViewer markdown={body} variant="grammar" />
          ) : (
            <p className="reader-placeholder">{error ? t("reader.loadLessonReferenceError") : t("common.loading")}</p>
          )}
          {body !== null && <LessonWordsTable lessonId={reference.lessonId} />}
        </article>
      </ReaderScrollArea>
    </ReaderShell>
  );
}
