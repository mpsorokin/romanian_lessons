import { ArrowRight, Database, GithubLogo, Moon, SlidersHorizontal, Tag, Trash, TextAa } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { DarkShell } from "../components/PageShell";
import { useProgress } from "../features/progress/useProgress";
import { useCardProgressActions } from "../features/cards/useCardProgress";
import { useReaderSettings } from "../features/reader-settings/ReaderSettingsProvider";

export function SettingsPage() {
  const { resetProgress } = useProgress();
  const { resetCardProgress } = useCardProgressActions();
  const { settings } = useReaderSettings();
  const handleResetReading = () => {
    if (window.confirm("Сбросить прогресс уроков и рассказов? Это действие нельзя отменить.")) resetProgress();
  };
  const handleResetCards = () => {
    if (window.confirm("Сбросить прогресс карточек? Это действие нельзя отменить.")) resetCardProgress();
  };

  return (
    <DarkShell className="settings-shell" right={<span />}> 
      <h1 className="page-heading">Настройки</h1>
      <section className="settings-section"><p className="eyebrow">ПРЕДПОЧТЕНИЯ ЧТЕНИЯ</p><div className="dark-card settings-list"><Link to="/settings/reader"><span><SlidersHorizontal size={18} /> Размер и интервал</span><strong>{settings.fontSize}px · {settings.lineHeight}</strong><ArrowRight size={16} /></Link><Link to="/settings/reader"><span><Moon size={18} /> Тема чтения</span><strong>{settings.theme === "paper" ? "Бумажная" : "Тёмная"}</strong><ArrowRight size={16} /></Link><div><span><TextAa size={18} /> Шрифт</span><strong>Lora (Serif)</strong></div></div></section>
      <section className="settings-section"><p className="eyebrow">ДАННЫЕ И ПРОГРЕСС</p><div className="dark-card settings-list"><div><span><Database size={18} /> Сохранение прогресса</span><strong>local storage</strong></div><button type="button" className="settings-danger" onClick={handleResetReading}><span><Trash size={18} /> Сбросить чтение</span><ArrowRight size={16} /></button><button type="button" className="settings-danger" onClick={handleResetCards}><span><Trash size={18} /> Сбросить карточки</span><ArrowRight size={16} /></button></div></section>
      <section className="settings-section"><p className="eyebrow">О ПРИЛОЖЕНИИ</p><div className="dark-card settings-list"><div><span><Tag size={18} /> Версия</span><strong>{__APP_VERSION__}</strong></div><div><span><GithubLogo size={18} /> GitHub</span><strong>Скоро</strong></div></div></section>
    </DarkShell>
  );
}
