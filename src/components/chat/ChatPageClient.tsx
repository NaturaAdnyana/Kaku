"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage, TextUIPart } from "ai";
import { Send, AlertTriangle, User } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  memo,
  ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import Image from "next/image";
import { motion } from "framer-motion";
import { BackButton } from "@/components/BackButton";
import { useSearchParams } from "next/navigation";

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

function hasMarkdownTable(text: string) {
  return /\|.+\|\s*\n\s*\|[\s:-]+\|/.test(text);
}

// ─── Shared primitives (no re-renders unless props change) ──────────────────

function Avatar({ isUser }: { isUser: boolean }) {
  return (
    <div
      className={cn(
        "w-9 h-9 rounded-base flex items-center justify-center shrink-0 mt-1 overflow-hidden border-2 border-border shadow-[2px_2px_0_var(--border)]",
        isUser ? "bg-secondary text-foreground" : "bg-blank text-foreground",
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

function Bubble({
  isUser,
  children,
}: {
  isUser: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "px-4 py-3 rounded-base text-[15px] leading-relaxed border-2 border-border shadow-[4px_4px_0_var(--border)]",
        isUser
          ? "bg-green-900 dark:bg-primary text-background"
          : "bg-blank text-foreground",
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
    const hasWideContent = !isUser && hasMarkdownTable(text);

    return (
      <motion.div
        initial={isUser ? { opacity: 0, y: 10, scale: 0.95 } : false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn(
          "flex gap-3",
          hasWideContent && "max-w-none self-start",
          !hasWideContent &&
            (isUser
              ? "sticky right-0 z-10 max-w-[calc(100vw-4rem)] self-end flex-row-reverse sm:max-w-[28rem] lg:max-w-[32rem]"
              : "sticky left-0 z-10 max-w-[calc(100vw-4rem)] self-start sm:max-w-[28rem] lg:max-w-[32rem]"),
        )}
      >
        <Avatar isUser={isUser} />
        <Bubble isUser={isUser}>
          {isUser ? (
            <p className="whitespace-pre-wrap wrap-break-word">{text}</p>
          ) : (
            <MarkdownRenderer content={text} />
          )}
        </Bubble>
      </motion.div>
    );
  },
  (prev, next) => prev.text === next.text && prev.role === next.role,
);

// ─── Live streaming bubble — re-renders freely on every token ───────────────

function StreamingBubble({ text }: { text: string }) {
  const hasWideContent = hasMarkdownTable(text);

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "flex gap-3",
        hasWideContent
          ? "max-w-none"
          : "sticky left-0 max-w-[calc(100vw-4rem)] sm:max-w-[28rem] lg:max-w-[32rem]",
      )}
    >
      <Avatar isUser={false} />
      <Bubble isUser={false}>
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap wrap-break-word">
          {text}
        </p>
      </Bubble>
    </motion.div>
  );
}

// ─── Typing indicator ────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="sticky left-0 flex gap-3 max-w-[calc(100vw-4rem)] sm:max-w-[28rem] lg:max-w-[32rem]"
    >
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
    </motion.div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

type ChatPageClientProps = {
  initialWord?: string;
};

type ChatContext =
  | { type: "topic"; word: string }
  | {
      type: "compare";
      sourceWord: string | null;
      words: string[];
      source: "detail" | "list";
    }
  | { type: "empty" };

function getChatContext(searchParams: URLSearchParams): ChatContext {
  const word = searchParams.get("word");
  const compareWords = Array.from(new Set(searchParams.getAll("compare")));
  const compareContext = searchParams.get("compareContext");

  if (compareWords.length > 0) {
    return {
      type: "compare",
      sourceWord: word,
      words: compareWords,
      source: compareContext === "list" ? "list" : "detail",
    };
  }

  if (word) {
    return { type: "topic", word };
  }

  return { type: "empty" };
}

function getInitialPrompt(context: ChatContext): string | null {
  if (context.type === "compare") {
    const wordList = context.words
      .map((currentWord) => `"${currentWord}"`)
      .join(", ");

    if (context.source === "list" || !context.sourceWord) {
      return `Please compare these selected saved Japanese words: ${wordList}. Focus on nuanced differences in meaning, usage, tone, and reading. Return a markdown table that makes the differences easy to scan, then add a short summary of when to use each word.`;
    }

    return `I'm learning the word/kanji "${context.sourceWord}". Please compare these related words: ${wordList}. Focus on nuanced differences in meaning, usage, tone, and reading. Return a markdown table that makes the differences easy to scan, then add a short summary of when to use each word.`;
  }

  if (context.type === "topic") {
    return `I'm learning the word/kanji "${context.word}". Please provide some example sentences using this kanji/word, and for each sentence, include its meaning and reading in a markdown table format.`;
  }

  return null;
}

export function ChatPageClient({ initialWord }: ChatPageClientProps) {
  const searchParams = useSearchParams();
  const chatContext = useMemo(() => {
    const params = new URLSearchParams(searchParams);
    if (initialWord && !params.has("word")) {
      params.set("word", initialWord);
    }

    return getChatContext(params);
  }, [initialWord, searchParams]);
  const initialPrompt = useMemo(
    () => getInitialPrompt(chatContext),
    [chatContext],
  );

  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);

  const {
    messages,
    sendMessage,
    status,
    error: chatError,
  } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isStreaming = status === "streaming";
  const isSubmitted = status === "submitted";
  const isLoading = isStreaming || isSubmitted;

  const lastMsg = messages[messages.length - 1];
  const renderableMessages = messages
    .map(toRenderableMessage)
    .filter(
      (
        message,
      ): message is NonNullable<ReturnType<typeof toRenderableMessage>> =>
        message !== null,
    );

  // Only the live streaming text re-renders on every token
  const streamingText =
    isStreaming && lastMsg?.role === "assistant"
      ? getText(lastMsg.parts)
      : null;

  const showTypingIndicator =
    isSubmitted ||
    (isStreaming && lastMsg?.role === "user") ||
    (isStreaming &&
      lastMsg?.role === "assistant" &&
      (!streamingText || streamingText.trim() === ""));

  // Handle specific error messages
  const errorMessage = chatError
    ? chatError.message.includes("429") ||
      chatError.message.includes("rate_limit")
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
  }, [
    renderableMessages,
    streamingText,
    showTypingIndicator,
    scrollToBottom,
    errorMessage,
  ]);

  // ── Auto-start ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasStartedRef.current && messages.length === 0 && initialPrompt) {
      hasStartedRef.current = true;
      sendMessage({
        text: initialPrompt,
      });
    }
  }, [initialPrompt, messages.length, sendMessage]);

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
          <BackButton className="shrink-0" />
          <div className="flex flex-col items-center min-w-0 px-2">
            <h1 className="text-base font-bold truncate">Koijo — AI Sensei</h1>
            <span className="text-xs text-muted-foreground font-medium">
              {chatContext.type === "compare" ? (
                <>
                  {chatContext.source === "list"
                    ? "Saved Compare:"
                    : "Compare:"}{" "}
                  <strong className="text-foreground">
                    {chatContext.words.length} words
                  </strong>
                </>
              ) : chatContext.type === "topic" ? (
                <>
                  Topic:{" "}
                  <strong className="text-foreground">{chatContext.word}</strong>
                </>
              ) : (
                "Ask anything"
              )}
            </span>
          </div>
          <div className="w-10 shrink-0" />
        </div>

        {/* ── Messages ── */}
        <div ref={scrollAreaRef} className="flex-1 overflow-auto px-4 py-4">
          <div className="flex w-max min-w-full flex-col gap-5 pr-8">
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
              <div className="sticky left-0 flex flex-col items-center gap-3 py-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-destructive/10 text-destructive border-2 border-destructive px-4 py-3 rounded-base text-sm font-bold flex items-center gap-2 shadow-[4px_4px_0_var(--destructive)]">
                  <AlertTriangle size={16} />
                  {errorMessage}
                </div>
              </div>
            )}

            <div className="h-1" />
          </div>
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
          <p className="text-center mt-3 text-[10px] text-muted-foreground tracking-wide flex justify-center items-center gap-1.5 flex-wrap">
            <span>Enter to send · Shift+Enter for newline</span>
            <span className="opacity-50 px-1 hidden sm:inline">|</span>
            <span className="flex items-center gap-1 text-muted-foreground font-bold md:font-normal">
              <AlertTriangle size={10} />
              Do not share sensitive information.
            </span>
          </p>
        </div>
      </main>
    </div>
  );
}
