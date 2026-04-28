"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
}

/**
 * iMessage-style chat bubble. User turns are right-aligned, primary-tinted
 * with a tail on the right; assistant turns are left-aligned with a muted
 * surface and a tail on the left. Content is rendered as markdown so the
 * model's bold/italic/list/code formatting comes through instead of being
 * displayed as raw asterisks.
 */
export function ChatBubble({ role, content, pending }: ChatBubbleProps) {
  const isUser = role === "user";
  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start",
      )}
      role="group"
      aria-label={isUser ? "Your message" : "Coach message"}
    >
      <div
        className={cn(
          "relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          // The asymmetric corner radius gives the bubble its tail on the
          // sender side without needing an SVG; matches the iMessage look.
          isUser
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md bg-muted text-foreground",
          pending && "opacity-70",
        )}
      >
        <MarkdownInline content={content} isUser={isUser} />
      </div>
    </div>
  );
}

/**
 * Lightweight markdown renderer with chat-friendly defaults: tight margins,
 * inline code chips, link styling that matches the bubble, and GFM tables/
 * task lists for the occasional structured response.
 */
export function MarkdownInline({
  content,
  isUser,
}: {
  content: string;
  isUser: boolean;
}) {
  return (
    <div
      className={cn(
        "prose-chat",
        isUser ? "prose-chat-user" : "prose-chat-assistant",
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="m-0 whitespace-pre-wrap [&:not(:last-child)]:mb-2">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="my-1 ml-5 list-disc space-y-0.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-1 ml-5 list-decimal space-y-0.5">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          h1: ({ children }) => (
            <h1 className="mt-1 mb-1 text-base font-semibold">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-1 mb-1 text-sm font-semibold">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-1 mb-1 text-sm font-semibold">{children}</h3>
          ),
          a: ({ href, children }) => {
            // Defence-in-depth: react-markdown doesn't render raw HTML by
            // default, but the model can still produce a markdown link
            // whose href is `javascript:`, `data:`, or another unsafe
            // scheme. Whitelist the protocols we want to ship as live
            // links and render anything else as a plain `<span>` — that
            // way assistive tech doesn't announce a "link" with no
            // target, and the bubble doesn't show an underlined affordance
            // the user can't actually follow.
            const isSafe =
              typeof href === "string" && /^(https?:|mailto:|\/)/i.test(href);
            if (!isSafe) {
              return (
                <span
                  className={cn(
                    isUser ? "text-primary-foreground" : "text-foreground",
                  )}
                >
                  {children}
                </span>
              );
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "underline underline-offset-2",
                  isUser
                    ? "text-primary-foreground/90 hover:text-primary-foreground"
                    : "text-primary hover:text-primary/80",
                )}
              >
                {children}
              </a>
            );
          },
          code: ({ inline, className, children, ...rest }: {
            inline?: boolean;
            className?: string;
            children?: React.ReactNode;
          }) => {
            // react-markdown 10's `code` renderer passes an explicit
            // `inline` flag — trust that over sniffing className. Fenced
            // blocks without a language tag (plain ``` … ```) have
            // `inline=false` but no `language-*` class, so the old
            // className check would render them as inline pills.
            const isBlock = inline === false;
            if (isBlock) {
              return (
                <code
                  className={cn(
                    "block whitespace-pre overflow-x-auto rounded-md p-2 text-xs font-mono",
                    isUser
                      ? "bg-primary-foreground/15 text-primary-foreground"
                      : "bg-foreground/10 text-foreground",
                    className,
                  )}
                  {...rest}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className={cn(
                  "rounded px-1 py-0.5 text-[0.85em] font-mono",
                  isUser
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-foreground/10 text-foreground",
                )}
                {...rest}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="m-0 my-1 whitespace-pre overflow-x-auto bg-transparent p-0">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote
              className={cn(
                "border-l-2 pl-2 my-1 italic",
                isUser ? "border-primary-foreground/40" : "border-border",
              )}
            >
              {children}
            </blockquote>
          ),
          hr: () => (
            <hr
              className={cn(
                "my-2 border-t",
                isUser ? "border-primary-foreground/30" : "border-border",
              )}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
