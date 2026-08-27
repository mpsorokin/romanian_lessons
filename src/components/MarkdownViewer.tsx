import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const plugins = [remarkGfm];

/**
 * Memoised on purpose: the reader saves its scroll position every 250ms, and
 * without this every save would re-parse the whole lesson.
 */
export const MarkdownViewer = memo(function MarkdownViewer({ markdown }: { markdown: string }) {
  return (
    <div className="markdown-viewer">
      <ReactMarkdown remarkPlugins={plugins}>{markdown}</ReactMarkdown>
    </div>
  );
});
