import { NotFound } from "@/components/feedback/NotFound";

export function ReaderNotFoundPage({ kind }: { kind: "урок" | "рассказ" | "топик грамматики" }) {
  return (
    <NotFound
      title={`Этот ${kind} не найден`}
      description="Проверьте ссылку или вернитесь к списку материалов."
      action={{ to: kind === "урок" ? "/lessons" : kind === "рассказ" ? "/stories" : "/grammar", label: "К списку" }}
    />
  );
}
