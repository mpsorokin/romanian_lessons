import { CardsThree } from "@phosphor-icons/react";
import { NotFound } from "@/components/feedback/NotFound";

export function CardNotFoundPage() {
  return (
    <NotFound
      eyebrow="КАРТОЧКИ"
      icon={<CardsThree size={32} aria-hidden="true" />}
      title="Колода не найдена"
      description="Вернитесь к списку колод и выберите другой урок."
      action={{ to: "/cards", label: "К колодам" }}
    />
  );
}
