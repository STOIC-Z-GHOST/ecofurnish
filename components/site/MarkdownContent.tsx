import type { ComponentProps } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders the Markdown an admin typed into the page editor.
 *
 * Safe by construction: react-markdown never renders raw HTML (there's no
 * rehype-raw here, so <script> or <iframe> typed into a page shows up as
 * plain text), and it strips unsafe link schemes like javascript:. Links
 * on this site stay in the tab; anything starting with http(s) opens in a
 * new one. Used by the public pages AND the editor's live preview, so what
 * you see while editing is what visitors get.
 */
function MarkdownLink({ href = "", children }: ComponentProps<"a">) {
  const className = "text-primary hover:underline";
  if (href.startsWith("/") && !href.startsWith("//")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  const external = /^https?:\/\//i.test(href);
  return (
    <a
      href={href}
      className={className}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

export function MarkdownContent({ children }: { children: string }) {
  return (
    <div className="space-y-4 text-sm text-muted-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h2 className="mt-8 text-lg font-semibold text-foreground">{children}</h2>
          ),
          h2: ({ children }) => (
            <h2 className="mt-8 text-lg font-semibold text-foreground">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-6 text-base font-semibold text-foreground">{children}</h3>
          ),
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          a: MarkdownLink,
          ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          blockquote: ({ children }) => (
            <blockquote className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-border/60 p-2 font-semibold text-foreground">{children}</th>
          ),
          td: ({ children }) => <td className="border-b border-border/40 p-2">{children}</td>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
