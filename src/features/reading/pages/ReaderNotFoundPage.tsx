import { NotFound } from "@/components/feedback/NotFound";

export function ReaderNotFoundPage({ kind }: { kind: "урок" | "рассказ" | "топик грамматики" }) {
  return (
    <NotFound
      title={`Этот ${kind} не найден`}
      description="Проверьте ссылку или вернитесь к списку материалов."
      action={{
        to: kind === "урок" ? "/library/lessons" : kind === "рассказ" ? "/library/stories" : "/library/grammar",
        label: "К списку",
      }}
    />
  );
}
