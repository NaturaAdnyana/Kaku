"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Undo, Trash2, Loader2, Check } from "lucide-react";
import { recognizeHandwriting, Trace, Stroke } from "@/lib/handwriting";
import { useTheme } from "next-themes";
import Lottie from "lottie-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

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

  // Animation state
  const [animationData, setAnimationData] = useState<Record<string, unknown> | null>(null);
  const [animationType, setAnimationType] = useState<"success" | "error" | null>(null);
  const [animationMessage, setAnimationMessage] = useState<string | null>(null);

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

  const loadAndPlayAnimation = async (type: "success" | "error") => {
    setAnimationType(type);
    
    const messages = type === "success" ? successMessages : errorMessages;
    setAnimationMessage(messages[Math.floor(Math.random() * messages.length)]);

    try {
      const animationFile = type === "success" ? "bird-flying-jump.json" : "level4.json";
      const res = await fetch(`/animations/${animationFile}`);
      const data = await res.json();
      setAnimationData(data);
      
      // Auto-hide animation after it finishes playing (let's say 3 seconds)
      setTimeout(() => {
        setAnimationType(null);
        setAnimationData(null);
        setAnimationMessage(null);
        if (type === "success") {
          handleClearCanvas();
        }
      }, 3000);
    } catch (err) {
      console.error("Failed to load animation", err);
      setAnimationType(null);
    }
  };

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
    <div className="flex flex-col items-center w-full max-w-sm mx-auto space-y-4">
      
      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="relative w-full aspect-square bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-inner overflow-hidden text-black dark:text-white"
        style={{ touchAction: "none" }}
      >
        {/* SVG Background Guide */}
        {svgContent && !animationType && (
          <div
            className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none dark:invert dark:hue-rotate-180 p-8"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}

        {/* Lottie Animation Overlay */}
        {animationType && animationData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-4">
            <Lottie
              animationData={animationData}
              loop={false}
              className="w-3/4 h-3/4 max-h-64 object-contain"
            />
            {animationMessage && (
              <div className={cn(
                "mt-2 font-bold text-lg text-center animate-in fade-in slide-in-from-bottom-2",
                animationType === "success" ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-400"
              )}>
                {animationMessage}
              </div>
            )}
          </div>
        )}

        {/* Streak Counter Overlay */}
        {streak > 0 && (
          <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 bg-white/90 dark:bg-black/90 backdrop-blur pl-2 pr-3.5 py-1.5 rounded-full border border-orange-200 dark:border-orange-900/50 shadow-sm animate-in zoom-in pointer-events-none">
            <Image
              src="/animations/fire.gif"
              alt="Streak Fire"
              width={20}
              height={20}
              unoptimized
              className="object-contain"
            />
            <span className="font-extrabold text-orange-500 dark:text-orange-400 text-sm drop-shadow-sm">
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

        {/* Action overlay */}
        <div className="absolute top-2 right-2 flex gap-2 z-20">
          <Button
            variant="secondary"
            size="icon"
            className="w-8 h-8 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur cursor-pointer"
            onClick={handleUndo}
            disabled={traces.length === 0 || !!animationType}
          >
            <Undo size={16} />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="w-8 h-8 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur text-red-400 cursor-pointer"
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
        className="w-full rounded-2xl shadow-md transition-all active:scale-95 h-13 cursor-pointer bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 border-none font-bold text-lg"
      >
        {isRecognizing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <span className="flex items-center gap-2">
            Submit <Check strokeWidth={3} size={20} />
          </span>
        )}
      </Button>

      {/* Fallback Candidates Area (Shown after 3 fails) */}
      {showCandidates && candidates.length > 0 && (
        <div className="w-full bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-2xl p-4 shadow-sm flex flex-col animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">
              Having trouble? Select your intended Kanji:
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {candidates.map((kanji, i) => (
              <button
                key={kanji + i}
                onClick={() => handleValidation(kanji)}
                className="flex items-center justify-center p-3 text-2xl bg-white hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl transition-colors relative active:scale-95 cursor-pointer border border-zinc-200 dark:border-zinc-700 shadow-sm"
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
