import { Link } from "react-router-dom";
import { DarkShell } from "../components/PageShell";

export function ReaderNotFoundPage({ kind }: { kind: "урок" | "рассказ" }) {
  return (
    <DarkShell title="Calea" className="not-found-shell">
      <div className="not-found">
        <p className="eyebrow">ОШИБКА</p>
        <h2>Этот {kind} не найден</h2>
        <p>Проверьте ссылку или вернитесь к списку материалов.</p>
        <Link className="primary-button" to={kind === "урок" ? "/lessons" : "/stories"}>К списку</Link>
      </div>
    </DarkShell>
  );
}
