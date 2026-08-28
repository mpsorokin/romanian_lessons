import { ArrowLeft, Check, TextAlignJustify } from "@phosphor-icons/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ReaderShell } from "@/components/layout/ReaderShell";
import { useReaderSettings } from "@/features/reader/ReaderSettingsProvider";
import type { ReaderSettings, ReaderTheme } from "@/features/reader/readerSettings.types";

export function ReaderSettingsPage() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useReaderSettings();
  const [draft, setDraft] = useState<ReaderSettings>(settings);
  const update = (patch: Partial<ReaderSettings>) => setDraft((current) => ({ ...current, ...patch }));
  const save = () => { updateSettings(draft); navigate("/settings"); };

  return (
    <ReaderShell theme="dark" className="reader-settings-shell">
      <header className="reader-settings-header"><button className="icon-button" type="button" onClick={() => navigate(-1)} aria-label="Назад"><ArrowLeft size={21} /></button><h1>Предпочтения чтения</h1><span /></header>
      <main className="reader-settings-main">
        <section><p className="eyebrow">ВНЕШНИЙ ВИД</p><div className="dark-card preference-card"><label htmlFor="font-size">Размер текста <output>{draft.fontSize}</output></label><div className="range-row"><span>A</span><input id="font-size" type="range" min="18" max="26" step="1" value={draft.fontSize} onChange={(event) => update({ fontSize: Number(event.target.value) })} /><span>A</span></div><label htmlFor="line-height">Межстрочный интервал <output>{draft.lineHeight.toFixed(2)}</output></label><div className="range-row"><TextAlignJustify size={19} aria-hidden="true" /><input id="line-height" type="range" min="1.4" max="2" step="0.05" value={draft.lineHeight} onChange={(event) => update({ lineHeight: Number(event.target.value) })} /><span>{draft.lineHeight.toFixed(2)}</span></div><div className="preference-row"><span><b>Ag</b> Шрифт</span><strong>Lora (Serif)</strong></div></div></section>
        <section><p className="eyebrow">ТЕМА ЧТЕНИЯ</p><div className="theme-choice"><ThemeButton theme="paper" active={draft.theme === "paper"} label="Бумажная" onClick={() => update({ theme: "paper" })} /><ThemeButton theme="dark" active={draft.theme === "dark"} label="Тёмная" onClick={() => update({ theme: "dark" })} /></div></section>
        <button className="primary-button" type="button" onClick={save}>Сохранить</button>
      </main>
    </ReaderShell>
  );
}

function ThemeButton({ theme, active, label, onClick }: { theme: ReaderTheme; active: boolean; label: string; onClick: () => void }) {
  return <button type="button" className={`theme-button theme-button--${theme} ${active ? "active" : ""}`} onClick={onClick}><span /><b>{label}</b>{active && <Check size={17} weight="bold" />}</button>;
}
