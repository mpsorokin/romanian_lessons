import { memo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const plugins = [remarkGfm];

/**
 * Memoised on purpose: the reader saves its scroll position every 250ms, and
 * without this every save would re-parse the whole lesson.
 */
export const MarkdownViewer = memo(function MarkdownViewer({ markdown, variant = "default" }: { markdown: string; variant?: "default" | "grammar" }) {
  const { t } = useTranslation();

  const components: Components = {
    h3: ({ children, ...props }) => {
      const text = typeof children === "string" ? children : String(children ?? "");
      const label =
        text === "🇷🇴"
          ? t("reader.sectionRomanian")
          : text === "🇷🇺"
            ? t("reader.sectionTranslation")
            : text === "🔊"
              ? t("reader.sectionPronunciation")
              : children;
      return <h3 {...props}>{label}</h3>;
    },
  };

  if (variant === "grammar") {
    components.table = ({ node: _node, children, ...props }) => (
      <div className="grammar-table-scroll" role="region" tabIndex={0} aria-label={t("reader.grammarTable")}>
        <table {...props}>{children}</table>
      </div>
    );
  }

  return (
    <div className={`markdown-viewer markdown-viewer--${variant}`}>
      <ReactMarkdown remarkPlugins={plugins} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
});
