import { useTranslation } from "react-i18next";
import { NotFound } from "@/components/feedback/NotFound";

export function ReaderNotFoundPage({ kind }: { kind: "lesson" | "story" | "grammar" }) {
  const { t } = useTranslation();
  const titleKey =
    kind === "lesson" ? "errors.lessonNotFound" : kind === "story" ? "errors.storyNotFound" : "errors.grammarNotFound";

  return (
    <NotFound
      title={t(titleKey)}
      description={t("errors.contentNotFoundDescription")}
      action={{
        to: kind === "lesson" ? "/library/lessons" : kind === "story" ? "/library/stories" : "/library/grammar",
        label: t("errors.toList"),
      }}
    />
  );
}
