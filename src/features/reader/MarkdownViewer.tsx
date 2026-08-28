import { memo, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const plugins = [remarkGfm];

/**
 * Memoised on purpose: the reader saves its scroll position every 250ms, and
 * without this every save would re-parse the whole lesson.
 */
export const MarkdownViewer = memo(function MarkdownViewer({ markdown, variant = "default" }: { markdown: string; variant?: "default" | "grammar" }) {
  const components: Components = { h3: ReaderLabelHeading };
  if (variant === "grammar") components.table = GrammarTable;

  return <div className={`markdown-viewer markdown-viewer--${variant}`}><ReactMarkdown remarkPlugins={plugins} components={components}>{markdown}</ReactMarkdown></div>;
});

function ReaderLabelHeading({ children, ...props }: { children?: ReactNode } & React.HTMLAttributes<HTMLHeadingElement>) {
  const text = typeof children === "string" ? children : String(children ?? "");
  const label = text === "🇷🇴" ? "Румынский" : text === "🇷🇺" ? "Перевод" : text === "🔊" ? "Произношение" : children;
  return <h3 {...props}>{label}</h3>;
}

function GrammarTable({ node: _node, children, ...props }: React.ComponentPropsWithoutRef<"table"> & { node?: unknown }) {
  return (
    <div className="grammar-table-scroll" role="region" tabIndex={0} aria-label="Таблица грамматики">
      <table {...props}>{children}</table>
    </div>
  );
}
