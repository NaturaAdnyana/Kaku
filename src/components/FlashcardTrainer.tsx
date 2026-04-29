"use client";

import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleX,
  Clock,
  History,
  Loader2,
  Mic,
  RotateCcw,
  Shuffle,
  Sparkles,
  TrendingUp,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";

import {
  getFlashcardDeck,
  hydrateFlashcards,
  getJishoReading,
  type FlashcardDeckSource,
  type FlashcardHydrationResult,
  type FlashcardItem,
  type FlashcardJlptLevel,
} from "@/app/actions/kanji";
import { LottiePlayer } from "@/components/LottieCanvas";
import { Button } from "@/components/ui/button";
import { useLottieAnimation } from "@/hooks/useLottieAnimation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type TrainerStatus =
  | "choosing"
  | "choosing-jlpt"
  | "loading"
  | "playing"
  | "finished";
type SpeechStatus = "idle" | "listening" | "matched" | "missed" | "unsupported";

type BrowserSpeechRecognitionEvent = {
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
};

type BrowserSpeechRecognitionErrorEvent = {
  error: string;
};

type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: new () => BrowserSpeechRecognition;
  webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
};

type SessionCard = FlashcardItem & {
  sessionId: string;
};

type CompletedCard = {
  sessionId: string;
  word: string;
  forgotCount: number;
};

const DECK_OPTIONS = [
  {
    source: "recent",
    title: "10 most recent search word",
    description: "Fresh saved words from your list.",
    icon: History,
  },
  {
    source: "frequent",
    title: "10 most search count hit word",
    description: "Saved words with the highest search count.",
    icon: TrendingUp,
  },
  {
    source: "jlpt-random",
    title: "Random JLPT word",
    description: "Choose N5 to N1, then train ten verbs from Jisho.",
    icon: Shuffle,
  },
] satisfies {
  source: FlashcardDeckSource;
  title: string;
  description: string;
  icon: LucideIcon;
}[];

const JLPT_LEVELS = ["n5", "n4", "n3", "n2", "n1"] satisfies FlashcardJlptLevel[];
const CARD_SWITCH_DELAY_MS = 260;
const FLASHCARD_PREFETCH_WINDOW = 3;
const FLASHCARD_HYDRATION_RETRY_LIMIT = 2;
const SPEECH_RESTART_WINDOW_MS = 5000;
const SPEECH_RESTART_LIMIT = 3;
const SPEECH_MISSED_FEEDBACK_MS = 1200;

function formatDuration(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function shuffleCards<T>(cards: T[]) {
  const shuffled = [...cards];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function katakanaToHiragana(value: string) {
  return value.replace(/[\u30a1-\u30f6]/g, (character) =>
    String.fromCharCode(character.charCodeAt(0) - 0x60),
  );
}

function normalizeJapaneseSpeech(value: string) {
  return katakanaToHiragana(value)
    .normalize("NFKC")
    .replace(/[\s、。,.!?！？ー]/g, "")
    .trim();
}

function getCardReading(card: FlashcardItem) {
  return card.reading ?? card.word;
}

function hasFlashcardDetails(card: FlashcardItem) {
  return Boolean(card.reading || card.meanings.length || card.partsOfSpeech.length);
}

function normalizeSpokenReading(value: string, card: FlashcardItem) {
  const normalizedSpeech = normalizeJapaneseSpeech(value);
  const normalizedWord = normalizeJapaneseSpeech(card.word);
  const normalizedReading = normalizeJapaneseSpeech(getCardReading(card));

  if (normalizedSpeech === normalizedWord) {
    return normalizedReading;
  }

  if (normalizedWord && normalizedSpeech.includes(normalizedWord)) {
    return normalizedSpeech.replaceAll(normalizedWord, normalizedReading);
  }

  return normalizedSpeech;
}

function hasKanji(value: string) {
  return /[\u3400-\u4dbf\u4e00-\u9faf]/.test(value);
}

function CardFace({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center rounded-base border-2 border-border bg-blank p-6 text-center shadow-shadow",
        className,
      )}
      style={{ backfaceVisibility: "hidden" }}
    >
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}

function ResultStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-base border-2 border-border bg-blank p-3 shadow-[2px_2px_0_var(--border)]">
      <div className="mb-2 inline-flex rounded-base border-2 border-border bg-main p-2 text-main-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

export function FlashcardTrainer() {
  const [status, setStatus] = useState<TrainerStatus>("choosing");
  const [selectedSource, setSelectedSource] =
    useState<FlashcardDeckSource | null>(null);
  const [selectedJlptLevel, setSelectedJlptLevel] =
    useState<FlashcardJlptLevel>("n2");
  const [pending, setPending] = useState<SessionCard[]>([]);
  const [completed, setCompleted] = useState<CompletedCard[]>([]);
  const [forgotCounts, setForgotCounts] = useState<Record<string, number>>({});
  const [deckSize, setDeckSize] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [speechStatus, setSpeechStatus] = useState<SpeechStatus>("idle");
  const [speechMessage, setSpeechMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const pendingRef = useRef<SessionCard[]>([]);
  const forgotCountsRef = useRef<Record<string, number>>({});
  const hydrationAttemptsRef = useRef<Record<string, number>>({});
  const inflightHydrationWordsRef = useRef<Set<string>>(new Set());
  const speechEnabledRef = useRef(false);
  const isSwitchingRef = useRef(false);
  const statusRef = useRef<TrainerStatus>("choosing");
  const speechStopRequestedRef = useRef(false);
  const speechRestartTimesRef = useRef<number[]>([]);
  const speechMissedTimerRef = useRef<number | null>(null);
  const hasCelebratedRef = useRef(false);
  const { animationData } = useLottieAnimation(
    status === "finished" ? "bird-flying-jump.json" : null,
  );
  const resumeSpeechListening = useEffectEvent((card: SessionCard) => {
    resetSpeechRestartGuard();
    startSpeechListening(card);
  });

  useEffect(() => {
    speechEnabledRef.current = speechEnabled;
  }, [speechEnabled]);

  useEffect(() => {
    isSwitchingRef.current = isSwitching;
  }, [isSwitching]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  useEffect(() => {
    forgotCountsRef.current = forgotCounts;
  }, [forgotCounts]);

  useEffect(() => {
    return () => {
      speechStopRequestedRef.current = true;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      if (speechMissedTimerRef.current !== null) {
        window.clearTimeout(speechMissedTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (status !== "playing") {
      return;
    }

    const cardsToHydrate = pending
      .slice(0, FLASHCARD_PREFETCH_WINDOW)
      .filter((card) => {
        if (hasFlashcardDetails(card)) {
          return false;
        }

        if (inflightHydrationWordsRef.current.has(card.word)) {
          return false;
        }

        return (
          (hydrationAttemptsRef.current[card.sessionId] ?? 0) <
          FLASHCARD_HYDRATION_RETRY_LIMIT
        );
      });

    if (cardsToHydrate.length === 0) {
      return;
    }

    for (const card of cardsToHydrate) {
      inflightHydrationWordsRef.current.add(card.word);
      hydrationAttemptsRef.current[card.sessionId] =
        (hydrationAttemptsRef.current[card.sessionId] ?? 0) + 1;
    }

    const words = cardsToHydrate.map((card) => card.word);

    void hydrateFlashcards(words)
      .then((response) => {
        if (!response.success || !response.data?.length) {
          return;
        }

        const hydrationByWord = new Map(
          response.data.map((item) => [item.word, item] satisfies [string, FlashcardHydrationResult]),
        );

        setPending((cards) =>
          cards.map((card) => {
            const hydrated = hydrationByWord.get(card.word);

            if (!hydrated || !hydrated.success) {
              return card;
            }

            return {
              ...card,
              reading: hydrated.reading,
              meanings: hydrated.meanings,
              partsOfSpeech: hydrated.partsOfSpeech,
            };
          }),
        );
      })
      .finally(() => {
        for (const word of words) {
          inflightHydrationWordsRef.current.delete(word);
        }
      });
  }, [pending, status]);

  useEffect(() => {
    if (status !== "finished") {
      hasCelebratedRef.current = false;
      return;
    }

    if (hasCelebratedRef.current) {
      return;
    }

    hasCelebratedRef.current = true;

    let cancelled = false;

    void import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) {
        return;
      }

      const defaults = {
        origin: { y: 0.7 },
        zIndex: 2000,
      };

      confetti({
        ...defaults,
        particleCount: 120,
        spread: 80,
        startVelocity: 42,
      });

      window.setTimeout(() => {
        if (cancelled) {
          return;
        }

        confetti({
          ...defaults,
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.75 },
        });
        confetti({
          ...defaults,
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.75 },
        });
      }, 180);
    });

    return () => {
      cancelled = true;
    };
  }, [status]);

  const currentCard = pending[0];
  const progress = deckSize > 0 ? Math.round((completed.length / deckSize) * 100) : 0;
  const elapsedTime =
    startedAt && finishedAt ? formatDuration(finishedAt - startedAt) : "0s";

  useEffect(() => {
    if (
      status !== "playing" ||
      !speechEnabled ||
      !currentCard ||
      isSwitching ||
      !hasFlashcardDetails(currentCard) ||
      recognitionRef.current
    ) {
      return;
    }

    resumeSpeechListening(currentCard);
  }, [currentCard, isSwitching, speechEnabled, status]);

  const results = useMemo(() => {
    const firstTry = completed.filter((card) => card.forgotCount === 0).length;
    const reviewed = completed.length - firstTry;
    const forgotTotal = completed.reduce(
      (sum, card) => sum + card.forgotCount,
      0,
    );

    return {
      firstTry,
      reviewed,
      forgotTotal,
      accuracy: deckSize > 0 ? Math.round((firstTry / deckSize) * 100) : 0,
    };
  }, [completed, deckSize]);

  const chartRows = [
    { label: "First try", value: results.firstTry, className: "bg-main" },
    { label: "Reviewed", value: results.reviewed, className: "bg-yellow-300" },
    { label: "Forgot", value: results.forgotTotal, className: "bg-red-300" },
  ];
  const chartMax = Math.max(...chartRows.map((row) => row.value), 1);

  function clearSpeechMissedTimer() {
    if (speechMissedTimerRef.current !== null) {
      window.clearTimeout(speechMissedTimerRef.current);
      speechMissedTimerRef.current = null;
    }
  }

  function disableSpeechListening(message: string, status: SpeechStatus = "idle") {
    speechEnabledRef.current = false;
    setSpeechEnabled(false);
    stopSpeechRecognition();
    clearSpeechMissedTimer();
    setSpeechStatus(status);
    setSpeechMessage(message);
  }

  function showMissedSpeechFeedback(message: string) {
    clearSpeechMissedTimer();
    setSpeechStatus("missed");
    setSpeechMessage(message);

    speechMissedTimerRef.current = window.setTimeout(() => {
      if (
        speechEnabledRef.current &&
        !isSwitchingRef.current &&
        statusRef.current === "playing"
      ) {
        setSpeechStatus("listening");
        setSpeechMessage("Still listening for a correct answer.");
      }
    }, SPEECH_MISSED_FEEDBACK_MS);
  }

  function stopSpeechRecognition() {
    speechStopRequestedRef.current = true;
    recognitionRef.current?.abort();
    recognitionRef.current = null;
  }

  function resetSpeechRestartGuard() {
    speechRestartTimesRef.current = [];
  }

  function startSpeechListening(card: SessionCard) {
    const SpeechRecognitionConstructor =
      (window as WindowWithSpeechRecognition).SpeechRecognition ??
      (window as WindowWithSpeechRecognition).webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      disableSpeechListening(
        "Speech check is not available in this browser.",
        "unsupported",
      );
      return;
    }

    stopSpeechRecognition();
    speechStopRequestedRef.current = false;

    const expectedReading = normalizeJapaneseSpeech(getCardReading(card));
    const recognition = new SpeechRecognitionConstructor();

    recognition.lang = "ja-JP";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const lastResultIndex = Math.max(0, event.results.length - 1);
      const transcript = event.results[lastResultIndex]?.[0]?.transcript ?? "";
      void handleSpeechResult(transcript, card, expectedReading);
    };
    recognition.onerror = (event) => {
      if (speechStopRequestedRef.current || event.error === "aborted") {
        return;
      }

      if (event.error === "not-allowed") {
        disableSpeechListening("Microphone permission was blocked.", "missed");
        return;
      }

      setSpeechStatus("listening");
      setSpeechMessage("Still listening...");
    };
    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }

      if (
        !speechStopRequestedRef.current &&
        speechEnabledRef.current &&
        !isSwitchingRef.current &&
        statusRef.current === "playing"
      ) {
        const now = Date.now();
        speechRestartTimesRef.current = [
          ...speechRestartTimesRef.current.filter(
            (timestamp) => now - timestamp <= SPEECH_RESTART_WINDOW_MS,
          ),
          now,
        ];

        if (speechRestartTimesRef.current.length > SPEECH_RESTART_LIMIT) {
          disableSpeechListening(
            "Speech check was turned off because this browser keeps ending listening.",
          );
          return;
        }

        window.setTimeout(() => {
          if (speechEnabledRef.current && !isSwitchingRef.current) {
            startSpeechListening(card);
          }
        }, 250);
      }
    };

    recognitionRef.current = recognition;
    setSpeechStatus("listening");
    setSpeechMessage("Listening...");
    clearSpeechMissedTimer();

    try {
      recognition.start();
    } catch {
      disableSpeechListening("Could not start listening.", "missed");
    }
  }

  async function getComparableSpokenReading(transcript: string, card: SessionCard) {
    const localReading = normalizeSpokenReading(transcript, card);
    const expectedReading = normalizeJapaneseSpeech(getCardReading(card));

    if (!transcript || localReading === expectedReading || !hasKanji(transcript)) {
      return localReading;
    }

    const response = await getJishoReading(transcript);

    if (response.success && response.reading) {
      return normalizeJapaneseSpeech(response.reading);
    }

    return localReading;
  }

  async function handleSpeechResult(
    transcript: string,
    card: SessionCard,
    expectedReading: string,
  ) {
    const text = transcript.toLowerCase();
    const isSkip = text && /skip|next|pass|スキップ|パス|わからない|分からない/.test(text);
    const isFlip = text && /flip|show|turn|フリップ|答えを教えて|めくって/.test(text);

    if (isSkip) {
      clearSpeechMissedTimer();
      setSpeechStatus("missed");
      setSpeechMessage("Skipped word.");
      void advanceCard("forget", card, { keepSpeechFeedback: true });
      return;
    }

    if (isFlip) {
      setIsFlipped(true);
      setSpeechStatus("listening");
      setSpeechMessage("Flipped card. Still listening...");
      return;
    }

    const spokenReading = await getComparableSpokenReading(transcript, card);

    if (spokenReading && spokenReading === expectedReading) {
      clearSpeechMissedTimer();
      setSpeechStatus("matched");
      setSpeechMessage(
        `Matched. Heard: ${transcript || getCardReading(card)} / Reading: ${getCardReading(card)}`,
      );
      void advanceCard("remember", card, { keepSpeechFeedback: true });
      return;
    }

    showMissedSpeechFeedback(
      transcript
        ? `Heard: ${transcript} / Reading: ${spokenReading || "unknown"}`
        : "Could not hear the reading.",
    );
  }

  async function startDeck(
    source: FlashcardDeckSource,
    options?: { jlptLevel?: FlashcardJlptLevel },
  ) {
    stopSpeechRecognition();
    setStatus("loading");
    setSelectedSource(source);
    if (options?.jlptLevel) {
      setSelectedJlptLevel(options.jlptLevel);
    }
    setError(null);
    resetSpeechRestartGuard();
    hydrationAttemptsRef.current = {};
    inflightHydrationWordsRef.current.clear();
    speechEnabledRef.current = false;
    setSpeechEnabled(false);
    setSpeechStatus("idle");
    setSpeechMessage(null);
    clearSpeechMissedTimer();

    const response = await getFlashcardDeck(source, options);

    if ("error" in response) {
      setError(response.error ?? "Failed to fetch flashcard deck.");
      setStatus("choosing");
      return;
    }

    const deck = response.data ?? [];

    if (deck.length === 0) {
      setError("No words found for this deck yet.");
      setStatus("choosing");
      return;
    }

    const orderedDeck =
      source === "recent" || source === "frequent" ? shuffleCards(deck) : deck;

    const nextPending = orderedDeck.map((card, index) => ({
      ...card,
      sessionId: `${card.id}-${index}`,
    }));

    pendingRef.current = nextPending;
    setPending(nextPending);
    setCompleted([]);
    forgotCountsRef.current = {};
    setForgotCounts({});
    setDeckSize(orderedDeck.length);
    setAttempts(0);
    setStartedAt(new Date().getTime());
    setFinishedAt(null);
    setIsFlipped(false);
    setIsSwitching(false);
    speechEnabledRef.current = false;
    setSpeechEnabled(false);
    setStatus("playing");
  }

  function finishIfDone(nextPending: SessionCard[]) {
    if (nextPending.length === 0) {
      setFinishedAt(new Date().getTime());
      setStatus("finished");
    }
  }

  async function advanceCard(
    outcome: "remember" | "forget",
    targetCard = currentCard,
    options?: { keepSpeechFeedback?: boolean },
  ) {
    const activePending = pendingRef.current;

    if (!targetCard || isSwitchingRef.current) return;
    if (activePending[0]?.sessionId !== targetCard.sessionId) return;

    stopSpeechRecognition();

    const remaining = activePending.slice(1);
    const nextPending =
      outcome === "forget"
        ? [
            ...remaining.slice(0, Math.min(3, remaining.length)),
            targetCard,
            ...remaining.slice(Math.min(3, remaining.length)),
          ]
        : remaining;
    const forgotCount = forgotCountsRef.current[targetCard.sessionId] ?? 0;
    const shouldKeepListening =
      speechEnabledRef.current && nextPending.length > 0;

    isSwitchingRef.current = true;
    setIsSwitching(true);
    if (!options?.keepSpeechFeedback) {
      setSpeechStatus("idle");
      setSpeechMessage(null);
      clearSpeechMissedTimer();
    }
    await wait(CARD_SWITCH_DELAY_MS);

    setAttempts((count) => count + 1);

    if (outcome === "remember") {
      setCompleted((cards) => [
        ...cards,
        {
          sessionId: targetCard.sessionId,
          word: targetCard.word,
          forgotCount,
        },
      ]);
    } else {
      const nextForgotCounts = {
        ...forgotCountsRef.current,
        [targetCard.sessionId]: forgotCount + 1,
      };

      forgotCountsRef.current = nextForgotCounts;
      setForgotCounts(nextForgotCounts);
    }

    pendingRef.current = nextPending;
    setPending(nextPending);
    setIsFlipped(false);
    isSwitchingRef.current = false;
    setIsSwitching(false);
    finishIfDone(nextPending);

    if (shouldKeepListening) {
      window.setTimeout(() => {
        if (
          speechEnabledRef.current &&
          !isSwitchingRef.current &&
          hasFlashcardDetails(nextPending[0])
        ) {
          startSpeechListening(nextPending[0]);
        }
      }, 80);
    } else if (nextPending.length === 0) {
      speechEnabledRef.current = false;
      setSpeechEnabled(false);
    }
  }

  function toggleSpeechListening() {
    if (!currentCard || isSwitching) return;

    if (!hasFlashcardDetails(currentCard)) {
      toast("Still loading this word from Jisho. Try again in a moment.");
      return;
    }

    if (speechEnabled) {
      speechEnabledRef.current = false;
      setSpeechEnabled(false);
      stopSpeechRecognition();
      setSpeechStatus("idle");
      setSpeechMessage(null);
      clearSpeechMissedTimer();
      return;
    }

    speechEnabledRef.current = true;
    setSpeechEnabled(true);
    resetSpeechRestartGuard();
    startSpeechListening(currentCard);
    toast("Say the word. Or say 'skip' (スキップ) to pass, 'flip' (フリップ) to show answer.", { icon: "💡", id: "speech-skip-hint" });
  }

  function resetTrainer() {
    stopSpeechRecognition();
    clearSpeechMissedTimer();
    resetSpeechRestartGuard();
    hydrationAttemptsRef.current = {};
    inflightHydrationWordsRef.current.clear();
    setStatus("choosing");
    setSelectedSource(null);
    pendingRef.current = [];
    setPending([]);
    setCompleted([]);
    forgotCountsRef.current = {};
    setForgotCounts({});
    setDeckSize(0);
    setAttempts(0);
    setStartedAt(null);
    setFinishedAt(null);
    setIsFlipped(false);
    speechEnabledRef.current = false;
    setSpeechEnabled(false);
    setIsSwitching(false);
    setSpeechStatus("idle");
    setSpeechMessage(null);
    setError(null);
  }

  if (status === "playing" && currentCard) {
    const isCurrentCardHydrated = hasFlashcardDetails(currentCard);
    const meanings = currentCard.meanings.length
      ? currentCard.meanings.join(", ")
      : "No meaning found.";
    const partOfSpeech = currentCard.partsOfSpeech[0];

    return (
      <div className="flex min-h-[calc(100dvh-8rem)] flex-col">
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
            <span>
              {completed.length + 1}/{deckSize}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-3 rounded-full border-2 border-border bg-blank">
            <div
              className="h-full rounded-full bg-main transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div
          className="relative min-h-[340px] flex-1"
          style={{ perspective: "1200px" }}
        >
          <button
            type="button"
            disabled={isSwitching}
            aria-label="Flip flashcard"
            className="absolute inset-0 w-full text-foreground outline-none focus-visible:ring-2 focus-visible:ring-main disabled:pointer-events-none"
            onClick={() => setIsFlipped((value) => !value)}
          >
            <motion.div
              animate={{
                opacity: isSwitching ? 0 : 1,
                y: isSwitching ? -18 : 0,
                scale: isSwitching ? 0.96 : 1,
              }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="relative h-full min-h-[340px]"
            >
              <div
                className="relative h-full min-h-[340px] transition-transform duration-300"
                style={{
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                <CardFace label="Word">
                  <div className="mt-5 break-all font-jp text-6xl font-black leading-tight sm:text-7xl">
                    {currentCard.word}
                  </div>
                  {currentCard.searchCount !== undefined && (
                    <p className="mt-5 rounded-base border-2 border-border bg-secondary px-3 py-1.5 text-xs font-black">
                      {currentCard.searchCount} searches
                    </p>
                  )}
                </CardFace>

                <CardFace
                  label="Reading and meaning"
                  className="[transform:rotateY(180deg)]"
                >
                  {isCurrentCardHydrated ? (
                    <>
                      <div className="mt-5 flex flex-col items-center gap-2">
                        <p className="font-jp text-xl font-bold text-muted-foreground">
                          {currentCard.word}
                        </p>
                        <p className="break-all font-jp text-4xl font-black leading-tight">
                          {getCardReading(currentCard)}
                        </p>
                      </div>
                      <p className="mt-5 max-w-xs text-base font-bold leading-relaxed">
                        {meanings}
                      </p>
                      {partOfSpeech && (
                        <p className="mt-5 rounded-base border-2 border-border bg-secondary px-3 py-1.5 text-xs font-black">
                          {partOfSpeech}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="mt-5 flex max-w-xs flex-col items-center gap-4">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <p className="text-sm font-black uppercase tracking-[0.12em] text-muted-foreground">
                        Loading from Jisho...
                      </p>
                    </div>
                  )}
                </CardFace>
              </div>
            </motion.div>
          </button>
        </div>

        {speechMessage && (
          <div
            className={cn(
              "mt-4 rounded-base border-2 border-border bg-blank px-3 py-2 text-center text-xs font-black shadow-[2px_2px_0_var(--border)]",
              speechStatus === "matched" && "bg-main text-main-foreground",
              speechStatus === "missed" &&
                "bg-red-100 text-red-950 dark:bg-red-950 dark:text-red-100",
            )}
          >
            {speechMessage}
          </div>
        )}

        <div className="mt-5 grid grid-cols-[1fr_auto_1fr] gap-3">
          <Button
            type="button"
            variant="neutral"
            disabled={isSwitching}
            className="h-14 bg-red-100 px-2 text-sm font-black uppercase text-red-950 dark:bg-red-950 dark:text-red-100"
            onClick={() => void advanceCard("forget")}
          >
            <CircleX className="h-4 w-4" />
            Forgot
          </Button>
          <Button
            type="button"
            variant="neutral"
            disabled={isSwitching}
            aria-pressed={speechEnabled}
            aria-label={
              speechEnabled
                ? "Turn off spoken reading check"
                : "Turn on spoken reading check"
            }
            className={cn(
              "h-14 w-14 px-0 text-sm font-black uppercase",
              speechEnabled && "bg-main text-main-foreground",
            )}
            onClick={toggleSpeechListening}
          >
            {speechStatus === "listening" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : speechStatus === "matched" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
          <Button
            type="button"
            disabled={isSwitching}
            className="h-14 px-2 text-sm font-black uppercase"
            onClick={() => void advanceCard("remember")}
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (status === "finished") {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-200">
        <section className="rounded-base border-2 border-border bg-main p-5 text-main-foreground shadow-shadow">
          <div className="flex items-center gap-4">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-base border-2 border-border bg-blank">
              {animationData ? (
                <LottiePlayer
                  animationData={animationData}
                  loop={true}
                  maxFps={15}
                  className="h-full w-full"
                />
              ) : (
                <Sparkles className="h-10 w-10" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.24em]">
                Congratulations
              </p>
              <h2 className="mt-2 text-3xl font-black leading-tight">
                Koijo says nice work.
              </h2>
            </div>
          </div>
        </section>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <ResultStat icon={Clock} label="Time" value={elapsedTime} />
          <ResultStat icon={Trophy} label="Score" value={`${results.accuracy}%`} />
          <ResultStat icon={BarChart3} label="Tries" value={`${attempts}`} />
        </div>

        <section className="mt-5 rounded-base border-2 border-border bg-blank p-4 shadow-shadow">
          <div className="space-y-3">
            {chartRows.map((row) => (
              <div key={row.label} className="grid grid-cols-[5.5rem_1fr_2rem] items-center gap-3">
                <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                  {row.label}
                </span>
                <div className="h-5 overflow-hidden rounded-base border-2 border-border bg-secondary">
                  <div
                    className={cn("h-full", row.className)}
                    style={{ width: `${Math.max(8, (row.value / chartMax) * 100)}%` }}
                  />
                </div>
                <span className="text-right text-sm font-black">{row.value}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {selectedSource && (
            <Button
              type="button"
              className="h-12 font-black uppercase"
              onClick={() =>
                void startDeck(
                  selectedSource,
                  selectedSource === "jlpt-random"
                    ? { jlptLevel: selectedJlptLevel }
                    : undefined,
                )
              }
            >
              <RotateCcw className="h-4 w-4" />
              Again
            </Button>
          )}
          <Button
            type="button"
            variant="neutral"
            className="h-12 font-black uppercase"
            onClick={resetTrainer}
          >
            Change
          </Button>
        </div>
      </div>
    );
  }

  if (status === "choosing-jlpt") {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-6 space-y-3">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-muted-foreground">
            JLPT deck
          </p>
          <h1 className="text-3xl font-black leading-tight text-foreground">
            Pick a level.
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {JLPT_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              className="flex h-20 items-center justify-center rounded-base border-2 border-border bg-blank text-2xl font-black uppercase shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
              onClick={() =>
                void startDeck("jlpt-random", { jlptLevel: level })
              }
            >
              {level}
            </button>
          ))}
        </div>

        <Button
          type="button"
          variant="neutral"
          className="mt-5 h-12 w-full font-black uppercase"
          onClick={() => setStatus("choosing")}
        >
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in zoom-in-95 duration-200">
      <div className="mb-6 space-y-3">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-muted-foreground">
          Flashcard
        </p>
        <h1 className="text-3xl font-black leading-tight text-foreground">
          Train with ten words.
        </h1>
      </div>

      {error && (
        <div className="mb-4 rounded-base border-2 border-border bg-red-100 p-3 text-sm font-bold text-red-950 shadow-[2px_2px_0_var(--border)] dark:bg-red-950 dark:text-red-100">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {DECK_OPTIONS.map(({ source, title, description, icon: Icon }) => {
          const isLoading = status === "loading" && selectedSource === source;

          return (
            <button
              key={source}
              type="button"
              disabled={status === "loading"}
              className="flex w-full items-center gap-3 rounded-base border-2 border-border bg-blank p-4 text-left shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none disabled:pointer-events-none disabled:opacity-60"
              onClick={() => {
                if (source === "jlpt-random") {
                  setSelectedSource(source);
                  setError(null);
                  setStatus("choosing-jlpt");
                  return;
                }

                void startDeck(source);
              }}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-base border-2 border-border bg-main text-main-foreground">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-black uppercase tracking-[0.08em]">
                  {title}
                </span>
                <span className="mt-1 block text-sm font-medium leading-relaxed text-muted-foreground">
                  {description}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
