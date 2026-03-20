import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TextUIPart, UIMessage } from "ai";

interface MarkdownRendererProps {
  message: UIMessage;
}

function getTextContent(message: UIMessage): string {
  return (message.parts ?? [])
    .filter((p): p is TextUIPart => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function MarkdownRenderer({ message }: MarkdownRendererProps) {
  const content = getTextContent(message);

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-li:my-0 prose-headings:my-2">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
