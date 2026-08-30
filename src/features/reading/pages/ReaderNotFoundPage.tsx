import { useTranslation } from "react-i18next";
import { NotFound } from "@/components/feedback/NotFound";

export function ReaderNotFoundPage({ kind }: { kind: "lesson" | "story" | "grammar" | "lesson-reference" }) {
  const { t } = useTranslation();
  const titleKey =
    kind === "lesson"
      ? "errors.lessonNotFound"
      : kind === "story"
        ? "errors.storyNotFound"
        : kind === "grammar"
          ? "errors.grammarNotFound"
          : "errors.lessonReferenceNotFound";

  return (
    <NotFound
      title={t(titleKey)}
      description={t("errors.contentNotFoundDescription")}
      action={{
        to:
          kind === "lesson"
            ? "/library/lessons"
            : kind === "story"
              ? "/library/stories"
              : kind === "grammar"
                ? "/library/grammar"
                : "/lessons-ref",
        label: t("errors.toList"),
      }}
    />
  );
}
