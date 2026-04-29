import React, { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
interface MarkdownRendererProps {
  content: string;
}

// Define plugins outside the component to prevent array reallocation on each render
const plugins = [remarkGfm];

const MarkdownRendererComponent = ({ content }: MarkdownRendererProps) => {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-li:my-0 prose-headings:my-2 prose-table:text-[15px] prose-table:leading-relaxed prose-th:whitespace-nowrap prose-td:whitespace-nowrap prose-th:px-3 prose-td:px-3 prose-th:py-2 prose-td:py-2">
      <ReactMarkdown
        remarkPlugins={plugins}
        components={{
          table: ({ children, ...props }) => (
            <div className="my-2 w-max min-w-full max-w-none">
              <table {...props}>{children}</table>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

// Memoize to prevent older chat messages from re-rendering during active streaming
export const MarkdownRenderer = memo(
  MarkdownRendererComponent,
  (prevProps, nextProps) => {
    return prevProps.content === nextProps.content;
  },
);
