"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Undo, Trash2, Loader2, Check } from "lucide-react";
import { recognizeHandwriting, Trace, Stroke } from "@/lib/handwriting";
import { useTheme } from "next-themes";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useLottieAnimation } from "@/hooks/useLottieAnimation";
import { LottiePlayer } from "@/components/LottieCanvas";

const successMessages = [
  "You nailed it! 🥳",
  "Perfect stroke! ✨",
  "Koijo is impressed! 🦅",
  "Spot on! 🎯",
  "Exactly right! 🌟",
];

const errorMessages = [
  "Oops, wrong Kanji! Try again. 😓",
  "Not quite right. 🧐",
  "That's not it, keep trying! 💪",
  "Hmm, incorrect stroke. ❌",
  "Try tracing the guide closely! 🖌️",
];

interface LearnCanvasProps {
  targetKanji: string;
  svgContent: string;
}

export function LearnCanvas({ targetKanji, svgContent }: LearnCanvasProps) {
  const { resolvedTheme } = useTheme();
  const strokeColor = resolvedTheme === "dark" ? "#ffffff" : "#000000";
  const guideColor = resolvedTheme === "dark" ? "#3f3f46" : "#e5e7eb";

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [traces, setTraces] = useState<Trace>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke>([[], [], []]);

  // Recognition and Validation state
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [showCandidates, setShowCandidates] = useState(false);
  const [streak, setStreak] = useState(0);

  // Animation state — filename drives the hook fetch; animationType controls visibility
  const [animationFilename, setAnimationFilename] = useState<string | null>(null);
  const [animationType, setAnimationType] = useState<"success" | "error" | null>(null);
  const [animationMessage, setAnimationMessage] = useState<string | null>(null);

  // Fetch + cache via shared hook (canvas-renderer friendly)
  const { animationData } = useLottieAnimation(animationFilename);

  const redraw = useCallback(
    (currentTraces: Trace) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw guide lines
      ctx.strokeStyle = guideColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.strokeStyle = strokeColor;

      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      currentTraces.forEach((stroke) => {
        const xs = stroke[0];
        const ys = stroke[1];
        if (xs.length === 0) return;

        ctx.beginPath();
        ctx.moveTo(xs[0], ys[0]);
        for (let i = 1; i < xs.length; i++) {
          ctx.lineTo(xs[i], ys[i]);
        }
        ctx.stroke();
      });
    },
    [guideColor, strokeColor],
  );

  // Resize canvas
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        const size = Math.min(container.clientWidth, 400);
        canvas.width = size;
        canvas.height = size;
        redraw(traces);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [redraw, traces]);

  // Redraw whenever traces change
  useEffect(() => {
    if (!animationType) {
      redraw(traces);
    }
  }, [traces, redraw, animationType]);

  const loadAndPlayAnimation = useCallback(async (type: "success" | "error") => {
    const file = type === "success" ? "bird-flying-jump.json" : "level4.json";
    const messages = type === "success" ? successMessages : errorMessages;

    setAnimationType(type);
    setAnimationFilename(file);   // triggers useLottieAnimation (cached after first fetch)
    setAnimationMessage(messages[Math.floor(Math.random() * messages.length)]);

    // Auto-hide after 3 s
    setTimeout(() => {
      setAnimationType(null);
      setAnimationFilename(null);
      setAnimationMessage(null);
      if (type === "success") {
        handleClearCanvas();
      }
    }, 3000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleValidation = async (submittedKanji: string) => {
    if (submittedKanji === targetKanji) {
      setFailCount(0);
      setStreak((s) => s + 1);
      setShowCandidates(false);
      setCandidates([]);
      await loadAndPlayAnimation("success");
    } else {
      const newFailCount = failCount + 1;
      setFailCount(newFailCount);
      setStreak(0);
      if (newFailCount >= 3) {
        setShowCandidates(true);
      }
      await loadAndPlayAnimation("error");
    }
  };

  const handleSubmit = async () => {
    if (traces.length === 0) return;

    setIsRecognizing(true);
    setCandidates([]);
    try {
      const results = await recognizeHandwriting(traces, {
        language: "ja",
        numOfReturn: 10,
      });
      setCandidates(results);
      
      if (results.length > 0) {
        await handleValidation(results[0]);
      } else {
        await loadAndPlayAnimation("error");
      }
    } catch (error) {
      console.error("Recognition Error:", error);
      await loadAndPlayAnimation("error");
    } finally {
      setIsRecognizing(false);
    }
  };

  // Drawing Logic
  const getCoordinates = (
    e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    let clientX, clientY;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (animationType) return;
    const { x, y } = getCoordinates(e);
    setIsDrawing(true);
    setCurrentStroke([[x], [y], [Date.now()]]);

    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = strokeColor;
      ctx.fill();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || animationType) return;
    e.preventDefault();

    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext("2d");

    if (ctx && currentStroke[0].length > 0) {
      const lastX = currentStroke[0][currentStroke[0].length - 1];
      const lastY = currentStroke[1][currentStroke[1].length - 1];

      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = strokeColor;

      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      setCurrentStroke((prev) => [
        [...prev[0], x],
        [...prev[1], y],
        [...prev[2], Date.now()],
      ]);
    }
  };

  const stopDrawing = (e?: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    if (e) e.preventDefault();
    setIsDrawing(false);

    if (currentStroke[0].length > 0) {
      const newTraces = [...traces, currentStroke];
      setTraces(newTraces);
      setCurrentStroke([[], [], []]);
    }
  };

  // Actions
  const handleUndo = () => {
    const newTraces = traces.slice(0, -1);
    setTraces(newTraces);
    redraw(newTraces);
  };

  const handleClearCanvas = () => {
    setTraces([]);
    setCandidates([]);
    setShowCandidates(false);
    redraw([]);
  };

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-4">
      <div
        ref={containerRef}
        className="relative w-full aspect-square overflow-hidden rounded-base border-2 border-border bg-blank text-foreground shadow-shadow"
        style={{ touchAction: "none" }}
      >
        {svgContent && !animationType && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center p-8 transition-opacity duration-1000 dark:invert dark:hue-rotate-180"
            style={{ opacity: Math.max(0, 0.2 - streak * 0.04) }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}

        {animationType && animationData && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-blank p-4">
            <LottiePlayer
              animationData={animationData}
              loop={false}
              className="w-3/4 h-3/4 max-h-64 object-contain"
            />
            {animationMessage && (
              <div
                className={cn(
                  "mt-3 max-w-[280px] px-2 text-center text-lg font-black leading-snug tracking-tight animate-in fade-in slide-in-from-bottom-2",
                  animationType === "success"
                    ? "text-main"
                    : "text-danger dark:text-rose-400",
                )}
              >
                {animationMessage}
              </div>
            )}
          </div>
        )}

        {streak > 0 && (
          <div className="pointer-events-none absolute top-3 left-3 z-30 flex items-center gap-1.5 rounded-base border-2 border-border bg-secondary py-1.5 pl-2 pr-3.5 shadow-[2px_2px_0_var(--border)] animate-in zoom-in">
            <Image
              src="/animations/fire.gif"
              alt="Streak Fire"
              width={20}
              height={20}
              unoptimized
              className="object-contain"
            />
            <span className="text-sm font-black text-orange-500 dark:text-orange-300">
              {streak}
            </span>
          </div>
        )}

        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
          className={cn(
            "absolute inset-0 w-full h-full z-10",
            animationType ? "pointer-events-none opacity-0" : "cursor-crosshair opacity-100"
          )}
        />

        <div className="absolute top-2 right-2 flex gap-2 z-20">
          <Button
            variant="neutral"
            size="icon"
            className="h-9 w-9 rounded-base cursor-pointer bg-secondary"
            onClick={handleUndo}
            disabled={traces.length === 0 || !!animationType}
          >
            <Undo size={16} />
          </Button>
          <Button
            variant="noShadow"
            size="icon"
            className="h-9 w-9 rounded-base cursor-pointer bg-danger text-white"
            onClick={handleClearCanvas}
            disabled={traces.length === 0 || !!animationType}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={traces.length === 0 || isRecognizing || !!animationType}
        className="h-13 w-full cursor-pointer text-lg font-bold"
      >
        {isRecognizing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <span className="flex items-center gap-2">
            Submit <Check strokeWidth={3} size={20} />
          </span>
        )}
      </Button>

      {showCandidates && candidates.length > 0 && (
        <div className="flex w-full flex-col rounded-base border-2 border-border bg-blank p-4 shadow-shadow animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold text-foreground">
              Having trouble? Select your intended Kanji:
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {candidates.map((kanji, i) => (
              <button
                key={kanji + i}
                onClick={() => handleValidation(kanji)}
                className="relative flex cursor-pointer items-center justify-center rounded-base border-2 border-border bg-secondary p-3 text-2xl font-bold shadow-[2px_2px_0_var(--border)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                {kanji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
