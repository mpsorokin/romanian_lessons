import { CardsThree } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { NotFound } from "@/components/feedback/NotFound";

export function CardNotFoundPage() {
  const { t } = useTranslation();

  return (
    <NotFound
      eyebrow={t("cards.notFoundEyebrow")}
      icon={<CardsThree size={32} aria-hidden="true" />}
      title={t("cards.deckNotFound")}
      description={t("cards.deckNotFoundDescription")}
      action={{ to: "/cards", label: t("cards.toDecks") }}
    />
  );
}
