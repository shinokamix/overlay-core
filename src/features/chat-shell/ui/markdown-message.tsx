import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/shared/lib/utils";

type Props = {
  text: string;
  className?: string;
};

export function MarkdownMessage({ text, className }: Props) {
  return (
    <div className={cn("markdown-message", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          h1: ({ children }) => (
            <h1 className="mb-2 mt-3 text-sm font-bold text-foreground first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-1.5 mt-2.5 text-xs font-bold text-foreground first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-1 mt-2 text-xs font-semibold text-foreground first:mt-0">
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul className="mb-1.5 ml-3 list-disc space-y-0.5 last:mb-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-1.5 ml-3 list-decimal space-y-0.5 last:mb-0">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-1.5 border-l-2 border-indigo-500/50 pl-3 text-muted-foreground">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-2 border-border" />,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-1.5 overflow-x-auto">
              <table className="w-full border-collapse text-[11px]">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border bg-surface-3 px-2 py-1 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => <td className="border border-border px-2 py-1">{children}</td>,
          code: ({ className: cls, children, ...props }) => {
            const match = /language-(\w+)/.exec(cls ?? "");
            const isBlock = !!match;

            if (isBlock) {
              return (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    margin: "6px 0",
                    borderRadius: "6px",
                    fontSize: "11px",
                    padding: "10px 12px",
                    border: "1px solid var(--border)",
                  }}
                  codeTagProps={{ style: { fontFamily: "inherit" } }}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              );
            }

            return (
              <code
                className="rounded bg-surface-3 px-1 py-0.5 font-mono text-[11px] text-indigo-300"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
