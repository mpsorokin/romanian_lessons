import { NotFound } from "@/components/feedback/NotFound";

export function ReaderNotFoundPage({ kind }: { kind: "урок" | "рассказ" }) {
  return (
    <NotFound
      title={`Этот ${kind} не найден`}
      description="Проверьте ссылку или вернитесь к списку материалов."
      action={{ to: kind === "урок" ? "/lessons" : "/stories", label: "К списку" }}
    />
  );
}
