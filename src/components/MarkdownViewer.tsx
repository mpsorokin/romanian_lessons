import { memo, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const plugins = [remarkGfm];

/**
 * Memoised on purpose: the reader saves its scroll position every 250ms, and
 * without this every save would re-parse the whole lesson.
 */
export const MarkdownViewer = memo(function MarkdownViewer({ markdown }: { markdown: string }) {
  return <div className="markdown-viewer"><ReactMarkdown remarkPlugins={plugins} components={{ h3: ReaderLabelHeading }}>{markdown}</ReactMarkdown></div>;
});

function ReaderLabelHeading({ children, ...props }: { children?: ReactNode } & React.HTMLAttributes<HTMLHeadingElement>) {
  const text = typeof children === "string" ? children : String(children ?? "");
  const label = text === "🇷🇴" ? "Румынский" : text === "🇷🇺" ? "Перевод" : text === "🔊" ? "Произношение" : children;
  return <h3 {...props}>{label}</h3>;
}
