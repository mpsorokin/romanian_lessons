import { ArrowRight } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

/** Shown once a session runs out of cards. */
export function SessionSummary({
  remembered,
  repeat,
  onRepeatDifficult,
}: {
  remembered: number;
  repeat: number;
  /** Absent when nothing was marked for repetition. */
  onRepeatDifficult?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <section className="card-summary">
      <p className="eyebrow">{t("cards.sessionDoneEyebrow")}</p>
      <h1>{t("cards.goodJob")}</h1>
      <p>{t("cards.sessionSummary", { remembered, total: remembered + repeat })}</p>
      <div className="card-summary__stats">
        <div>
          <strong>{remembered}</strong>
          <span>{t("cards.rememberedStat")}</span>
        </div>
        <div>
          <strong>{repeat}</strong>
          <span>{t("cards.repeatStat")}</span>
        </div>
      </div>
      {onRepeatDifficult && (
        <button className="primary-button" type="button" onClick={onRepeatDifficult}>
          {t("cards.repeatDifficult")}
        </button>
      )}
      <Link className="secondary-button" to="/cards">
        {t("cards.backToDecks")} <ArrowRight size={17} />
      </Link>
    </section>
  );
}
