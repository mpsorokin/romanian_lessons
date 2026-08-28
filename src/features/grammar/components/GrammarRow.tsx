import { ArrowRight } from "@phosphor-icons/react";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Grammar } from "@/lib/content.types";

export const GrammarRow = memo(function GrammarRow({ topic, progress }: { topic: Grammar; progress: number }) {
  const { t } = useTranslation();
  const percent = Math.round(progress * 100);

  return (
    <Link className="grammar-topic-row" to={`/grammar/${topic.id}`}>
      <span className="grammar-topic-row__main">
        <strong>{topic.title}</strong>
        {topic.subtitle && <small>{topic.subtitle}</small>}
        {topic.tags && topic.tags.length > 0 && (
          <span className="grammar-topic-row__tags" aria-label={t("grammar.tags", { tags: topic.tags.join(", ") })}>
            {topic.tags.slice(0, 3).map((tag) => (
              <span className="grammar-topic-row__tag" key={tag}>
                {tag}
              </span>
            ))}
          </span>
        )}
        {percent > 0 && (
          <ProgressBar value={progress} className="grammar-topic-row__progress" label={t("content.percentRead", { percent })} />
        )}
      </span>
      <span className="grammar-topic-row__side">
        {topic.level && <span className="grammar-topic-row__level">{topic.level}</span>}
        <ArrowRight size={17} aria-hidden="true" />
      </span>
    </Link>
  );
});
