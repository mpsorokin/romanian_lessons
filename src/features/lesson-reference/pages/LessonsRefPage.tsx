import { ArrowRight, Notebook } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { lessonReferenceContent } from "@/lib/content";

export function LessonsRefPage() {
  const { t } = useTranslation();

  return (
    <AppShell title={t("lessonReference.title")} showBack backTo="/library" className="lesson-reference-shell">
      <div className="lesson-reference-intro">
        <p className="eyebrow">{t("lessonReference.eyebrow")}</p>
        <p>{t("lessonReference.intro")}</p>
      </div>

      <div className="lesson-reference-list" aria-label={t("lessonReference.listLabel")}>
        {lessonReferenceContent.map((reference) => (
          <Link className="lesson-reference-row" key={reference.id} to={`/lessons-ref/${reference.id}`}>
            <Notebook size={22} weight="regular" aria-hidden="true" />
            <span className="lesson-reference-row__main">
              <small>{t("lessonReference.lessonLabel", { order: String(reference.order).padStart(2, "0") })}</small>
              <strong>{reference.title}</strong>
              {reference.subtitle && <span>{reference.subtitle}</span>}
            </span>
            <span className="lesson-reference-row__side">
              {reference.level && <small>{reference.level}</small>}
              <ArrowRight size={17} aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
