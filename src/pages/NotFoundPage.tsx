import { NotFound } from "@/components/feedback/NotFound";

export function NotFoundPage() {
  return (
    <NotFound
      title="Страница не найдена"
      description="Вернитесь к обзору и продолжите чтение."
      action={{ to: "/", label: "На главную" }}
    />
  );
}
