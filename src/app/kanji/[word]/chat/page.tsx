"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage, TextUIPart } from "ai";
import { buttonVariants } from "@/components/ui/button";
import { ChevronLeft, Send, AlertTriangle, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, use, useState, useCallback, memo, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import Image from "next/image";

// ─── helpers ────────────────────────────────────────────────────────────────

function getText(parts: UIMessage["parts"]): string {
  return (parts ?? [])
    .filter((p): p is TextUIPart => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function toRenderableMessage(message: UIMessage) {
  const text = getText(message.parts).trim();

  if (!text) {
    return null;
  }

  return {
    id: message.id,
    role: message.role,
    text,
  };
}

// ─── Shared primitives (no re-renders unless props change) ──────────────────

function Avatar({ isUser }: { isUser: boolean }) {
  return (
    <div
      className={cn(
        "w-9 h-9 rounded-base flex items-center justify-center shrink-0 mt-1 overflow-hidden border-2 border-border",
        isUser ? "bg-secondary text-foreground" : "bg-main text-main-foreground",
      )}
    >
      {isUser ? (
        <User size={14} />
      ) : (
        <Image
          src="/animations/bird-speak.gif"
          alt="Koijo"
          width={44}
          height={44}
          className="w-11 h-11 object-contain pointer-events-none"
          unoptimized
        />
      )}
    </div>
  );
}

function Bubble({ isUser, children }: { isUser: boolean; children: ReactNode }) {
  return (
    <div
      className={cn(
        "px-4 py-3 rounded-base text-[15px] leading-relaxed border-2 border-border shadow-[4px_4px_0_var(--border)]",
        isUser ? "bg-foreground text-background" : "bg-blank text-foreground",
      )}
    >
      {children}
    </div>
  );
}

// ─── Frozen message — memo with content equality, NEVER re-renders after stabilising ──

const FrozenMessage = memo(
  function FrozenMessage({ role, text }: { role: string; text: string }) {
    const isUser = role === "user";
    return (
      <div className={cn("flex gap-3 max-w-[88%]", isUser ? "ml-auto flex-row-reverse" : "")}>
        <Avatar isUser={isUser} />
        <Bubble isUser={isUser}>
          {isUser ? (
            <p className="whitespace-pre-wrap wrap-break-word">{text}</p>
          ) : (
            <MarkdownRenderer content={text} />
          )}
        </Bubble>
      </div>
    );
  },
  (prev, next) => prev.text === next.text && prev.role === next.role,
);

// ─── Live streaming bubble — re-renders freely on every token ───────────────

function StreamingBubble({ text }: { text: string }) {
  return (
    <div className="flex gap-3 max-w-[88%]">
      <Avatar isUser={false} />
      <Bubble isUser={false}>
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap wrap-break-word">
          {text}
        </p>
      </Bubble>
    </div>
  );
}

// ─── Typing indicator ────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-3 max-w-[88%]">
      <Avatar isUser={false} />
      <div className="px-5 py-4 rounded-base bg-blank border-2 border-border shadow-[4px_4px_0_var(--border)] flex items-center gap-1.5 h-12">
        {["-0.3s", "-0.15s", "0s"].map((delay) => (
          <div
            key={delay}
            className="w-1.5 h-1.5 bg-main rounded-full animate-bounce"
            style={{ animationDelay: delay }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ word: string }> };

export default function ChatPage({ params }: Props) {
  const { word } = use(params);
  const decodedWord = decodeURIComponent(word);

  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);

  const { messages, sendMessage, status, error: chatError } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isStreaming = status === "streaming";
  const isSubmitted = status === "submitted";
  const isLoading = isStreaming || isSubmitted;

  const lastMsg = messages[messages.length - 1];
  const renderableMessages = messages
    .map(toRenderableMessage)
    .filter((message): message is NonNullable<ReturnType<typeof toRenderableMessage>> => message !== null);

  // Only the live streaming text re-renders on every token
  const streamingText =
    isStreaming && lastMsg?.role === "assistant" ? getText(lastMsg.parts) : null;

  const showTypingIndicator =
    isSubmitted || (isStreaming && lastMsg?.role === "user");

  // Handle specific error messages
  const errorMessage = chatError
    ? chatError.message.includes("429") || chatError.message.includes("rate_limit")
      ? "Rate limit reached. Please wait a moment."
      : "Something went wrong. Please try again."
    : null;

  // ── Scroll — direct DOM write, no React involvement ──────────────────────
  const scrollToBottom = useCallback(() => {
    const el = scrollAreaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [renderableMessages, streamingText, showTypingIndicator, scrollToBottom, errorMessage]);

  // ── Auto-start ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasStartedRef.current && messages.length === 0) {
      hasStartedRef.current = true;
      sendMessage({
        text: `I'm learning the word/kanji "${decodedWord}". Please provide some example sentences using this kanji/word, and for each sentence, include its meaning and reading in a markdown table format.`,
      });
    }
  }, [decodedWord, messages.length, sendMessage]);

  // ── Auto-grow textarea ───────────────────────────────────────────────────
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [input]);

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const text = input.trim();
      if (!text || isLoading) return;
      sendMessage({ text });
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    },
    [input, isLoading, sendMessage],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-dvh bg-bg font-sans">
      <main className="flex flex-col flex-1 min-h-0 w-full max-w-md mx-auto lg:max-w-xl jp-bg">

        {/* ── Header ── */}
        <div className="flex items-center justify-between p-4 border-b-2 border-border bg-secondary shrink-0">
          <Link
            href={`/kanji/${encodeURIComponent(decodedWord)}`}
            className={cn(
              buttonVariants({ variant: "neutral", size: "icon" }),
              "shrink-0 cursor-pointer",
            )}
            aria-label="Back"
          >
            <ChevronLeft size={22} />
          </Link>
          <div className="flex flex-col items-center min-w-0 px-2">
            <h1 className="text-base font-bold truncate">Koijo — AI Sensei</h1>
            <span className="text-xs text-muted-foreground font-medium">
              Topic: <strong className="text-foreground">{decodedWord}</strong>
            </span>
          </div>
          <div className="w-10 shrink-0" />
        </div>

        {/* ── Warning ── */}
        <div className="bg-main text-main-foreground px-4 py-2.5 mx-4 mt-3 rounded-base flex gap-2.5 text-xs border-2 border-border items-center shadow-[3px_3px_0_var(--border)] font-bold shrink-0">
          <AlertTriangle size={14} className="shrink-0" />
          <p>Do not share personal or sensitive information with Koijo.</p>
        </div>

        {/* ── Messages ── */}
        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {renderableMessages.map((m) => {
            if (m.id === lastMsg?.id && m.role === "assistant" && isStreaming) {
              return null;
            }

            return <FrozenMessage key={m.id} role={m.role} text={m.text} />;
          })}

          {/* Live streaming bubble — re-renders on every token, isolated */}
          {streamingText && streamingText.trim() !== "" && (
            <StreamingBubble text={streamingText} />
          )}

          {/* Typing dots */}
          {showTypingIndicator && <TypingIndicator />}

          {/* Error Notice */}
          {errorMessage && (
            <div className="flex flex-col items-center gap-3 py-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-destructive/10 text-destructive border-2 border-destructive px-4 py-3 rounded-base text-sm font-bold flex items-center gap-2 shadow-[4px_4px_0_var(--destructive)]">
                <AlertTriangle size={16} />
                {errorMessage}
              </div>
            </div>
          )}

          <div className="h-1" />
        </div>

        {/* ── Input ── */}
        <div className="p-3 bg-secondary border-t-2 border-border shrink-0">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="relative flex-1 bg-blank rounded-base border-2 border-border shadow-shadow focus-within:ring-4 focus-within:ring-main focus-within:translate-x-boxShadowX focus-within:translate-y-boxShadowY focus-within:shadow-none transition-all min-h-[52px] flex items-center">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Ask something about this kanji…"
                disabled={isLoading}
                autoComplete="off"
                maxLength={600}
                className="w-full bg-transparent px-4 py-3 text-sm outline-none disabled:opacity-50 resize-none leading-relaxed"
                aria-label="Message input"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="h-[52px] w-[52px] flex items-center justify-center bg-main text-main-foreground border-2 border-border shadow-shadow rounded-base transition-all active:translate-x-boxShadowX active:translate-y-boxShadowY active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              title="Send"
            >
              <Send size={18} />
            </button>
          </form>
          <p className="text-center mt-3 text-[10px] text-muted-foreground tracking-wide">
            Enter to send · Shift+Enter for newline
          </p>
        </div>
      </main>
    </div>
  );
}
