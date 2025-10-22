import Markdown from "react-markdown";

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-slate max-w-none dark:prose-invert">
      <Markdown>{content}</Markdown>
    </div>
  );
}
