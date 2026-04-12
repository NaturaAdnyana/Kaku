"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage, TextUIPart } from "ai";
import { buttonVariants } from "@/components/ui/button";
import { ChevronLeft, Send, User, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, use, useState } from "react";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import Image from "next/image";

function getMessageText(parts: UIMessage["parts"]): string {
  return (parts ?? [])
    .filter((p): p is TextUIPart => p.type === "text")
    .map((p) => p.text)
    .join("");
}

type Props = {
  params: Promise<{
    word: string;
  }>;
};

export default function ChatPage({ params }: Props) {
  const { word } = use(params);
  const decodedWord = decodeURIComponent(word);

  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);
  const lastScrollRef = useRef<number>(0);

  // Auto-start chat
  useEffect(() => {
    if (!hasStartedRef.current && messages.length === 0) {
      hasStartedRef.current = true;
      sendMessage({
        text: `I'm learning the word/kanji "${decodedWord}". Please provide some example sentences using this kanji/word, and for each sentence, include its meaning and reading in a markdown table format.`,
      });
    }
  }, [decodedWord, messages.length, sendMessage]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (status === "streaming") {
      const now = Date.now();
      // Throttle scrolling during stream to maximum 10fps (every 100ms) to prevent heavy layout thrashing
      if (now - lastScrollRef.current > 100) {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
        lastScrollRef.current = now;
      }
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <div className="flex flex-col min-h-dvh bg-bg font-sans relative">
      <main className="flex flex-col flex-1 w-full max-w-md mx-auto lg:max-w-xl jp-bg">
        {/* Header Navigation */}
        <div className="flex items-center justify-between p-4 border-b-2 border-border bg-secondary sticky top-0 z-20">
          <Link
            href={`/kanji/${encodeURIComponent(decodedWord)}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "mr-2 text-zinc-600 dark:text-zinc-400 cursor-pointer",
            )}
            aria-label="Back to word details"
          >
            <ChevronLeft size={24} />
          </Link>
          <div className="flex flex-col items-center">
            <h1 className="text-lg font-bold">
              Koijo - The Genius Anomaly Bird
            </h1>
            <span className="text-xs text-zinc-500 font-medium">
              Topic: {decodedWord}
            </span>
          </div>
          <div className="min-w-10"></div>
        </div>

        {/* Warning Banner */}
        <div className="bg-main text-main-foreground p-3 mx-4 mt-4 rounded-base flex gap-3 text-sm border-2 border-border items-start shadow-[4px_4px_0_var(--border)] font-bold shrink-0">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong>Warning:</strong> Please do not send any important,
            sensitive, or personal data to Koijo.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((m: UIMessage) => (
            <div
              key={m.id}
              className={cn(
                "flex gap-3 max-w-[85%]",
                m.role === "user" ? "ml-auto flex-row-reverse" : "",
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-base flex items-center justify-center shrink-0 mt-1 overflow-hidden border-2 border-border shadow-[2px_2px_0_var(--border)]",
                  m.role === "user"
                    ? "bg-secondary text-foreground"
                    : "bg-main text-main-foreground",
                )}
              >
                {m.role === "user" ? (
                  <User size={16} />
                ) : (
                  <Image
                    src="/animations/bird-speak.gif"
                    alt="Koijo"
                    width={56}
                    height={56}
                    className="w-14 h-14 object-contain pointer-events-none"
                  />
                )}
              </div>

              <div
                className={cn(
                  "px-4 py-3 rounded-base text-[15px] leading-relaxed border-2 border-border shadow-[4px_4px_0_var(--border)]",
                  m.role === "user"
                    ? "bg-foreground text-background"
                    : "bg-blank text-foreground wrap-break-word whitespace-pre-wrap",
                )}
              >
                {m.role === "user" ? (
                  getMessageText(m.parts)
                ) : (
                  <MarkdownRenderer content={getMessageText(m.parts)} />
                )}
              </div>
            </div>
          ))}

          {isLoading &&
            messages.length > 0 &&
            messages[messages.length - 1].role === "user" && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-10 h-10 rounded-base flex items-center justify-center shrink-0 mt-1 bg-main text-main-foreground border-2 border-border shadow-[2px_2px_0_var(--border)] overflow-hidden">
                  <Image
                    src="/animations/bird-speak.gif"
                    alt="Koijo"
                    width={56}
                    height={56}
                    className="w-14 h-14 object-contain pointer-events-none"
                  />
                </div>
                <div className="px-5 py-4 rounded-base bg-blank border-2 border-border shadow-[4px_4px_0_var(--border)] flex items-center gap-1.5 h-12.5">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}

          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-secondary border-t-2 border-border sticky bottom-0 z-20 font-bold">
          <form
            onSubmit={handleSubmit}
            className="relative flex items-end gap-2"
          >
            <div className="relative flex-1 bg-blank rounded-base border-2 border-border shadow-shadow focus-within:ring-4 focus-within:ring-main focus-within:translate-x-boxShadowX focus-within:translate-y-boxShadowY focus-within:shadow-none transition-all">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask something about this kanji..."
                disabled={isLoading}
                autoComplete="off"
                maxLength={600}
                className="w-full bg-transparent px-4 py-3.5 pr-12 text-sm outline-none disabled:opacity-50"
                aria-label="Message input"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-3.5 bg-danger text-white border-2 border-border shadow-shadow rounded-base transition-all active:translate-x-boxShadowX active:translate-y-boxShadowY active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              title="Send message"
              aria-label="Send message"
            >
              <Send
                size={18}
                className={cn(
                  input.trim() && !isLoading
                    ? "-translate-x-0.5 translate-y-0.5 transition-transform"
                    : "",
                  "active:translate-x-0.5 active:-translate-y-0.5",
                )}
              />
            </button>
          </form>
          {status === "error" && (
            <p className="mt-2 text-xs text-red-500 text-center">
              Message failed to send. Please try again.
            </p>
          )}
          <div className="text-center mt-3">
            <span className="text-[10px] text-zinc-400 font-medium tracking-wide">
              Koijo can make mistakes. Verify important information.
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
