import { useTranslation } from "react-i18next";
import { NotFound } from "@/components/feedback/NotFound";

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <NotFound
      title={t("errors.pageNotFound")}
      description={t("errors.pageNotFoundDescription")}
      action={{ to: "/", label: t("errors.home") }}
    />
  );
}
