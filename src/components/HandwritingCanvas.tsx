"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Undo, Trash2, Loader2, Search, X, PenLine } from "lucide-react";
import { saveKanji } from "@/app/actions/kanji";
import { recognizeHandwriting, Trace, Stroke } from "@/lib/handwriting";
import { useTheme } from "next-themes";
import { useSearchAnimation } from "./SearchAnimationProvider";

import { useQueryClient } from "@tanstack/react-query";

export function HandwritingCanvas() {
  const queryClient = useQueryClient();
  const { resolvedTheme } = useTheme();
  const strokeColor = resolvedTheme === "dark" ? "#ffffff" : "#000000";
  const guideColor = resolvedTheme === "dark" ? "#3f3f46" : "#e5e7eb"; // zinc-800 : zinc-200

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const recognizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [traces, setTraces] = useState<Trace>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke>([[], [], []]);

  // Recognition state
  const [candidates, setCandidates] = useState<string[]>([]);
  const [isRecognizing, setIsRecognizing] = useState(false);

  // Word Building State
  const [composedWord, setComposedWord] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Animation state (handled by provider)
  const { triggerSearchAnimation } = useSearchAnimation();

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

  // --- Resize canvas ---
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        const size = Math.min(container.clientWidth, 400);
        canvas.width = size;
        canvas.height = size;
        // Redraw using the current traces in state via the canvas ref
        redraw(traces);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redraw]);

  // Redraw whenever traces change
  useEffect(() => {
    redraw(traces);
  }, [traces, redraw]);

  // Cleanup timer on unmount to avoid state updates on an unmounted component
  useEffect(() => {
    return () => {
      if (recognizeTimerRef.current !== null) {
        clearTimeout(recognizeTimerRef.current);
      }
    };
  }, []);

  // --- Recognition Logic ---
  const recognize = useCallback(async (currentTraces: Trace) => {
    if (currentTraces.length === 0) {
      setCandidates([]);
      return;
    }

    setIsRecognizing(true);
    try {
      const results = await recognizeHandwriting(currentTraces, {
        language: "ja",
        numOfReturn: 10,
      });
      setCandidates(results);
    } catch (error) {
      console.error("Recognition Error:", error);
      setCandidates([]);
    } finally {
      setIsRecognizing(false);
    }
  }, []);

  // --- Drawing Logic ---
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
    if (!isDrawing) return;
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

      // Clear any pending recognition timer before scheduling a new one
      if (recognizeTimerRef.current !== null) {
        clearTimeout(recognizeTimerRef.current);
      }
      recognizeTimerRef.current = setTimeout(() => recognize(newTraces), 500);
    }
  };

  // --- Actions ---
  const handleUndo = () => {
    const newTraces = traces.slice(0, -1);
    setTraces(newTraces);
    redraw(newTraces);
    recognize(newTraces);
  };

  const handleClearCanvas = () => {
    setTraces([]);
    setCandidates([]);
    redraw([]);
  };

  const handleSelectKanji = (kanji: string) => {
    setComposedWord((prev) => prev + kanji);
    handleClearCanvas();
  };

  const handleSearchAndSave = async () => {
    if (!composedWord.trim()) return;

    setIsSaving(true);
    try {
      const response = await saveKanji(composedWord);
      if ("success" in response && response.success) {
        queryClient.invalidateQueries({ queryKey: ["kanji-list"] });
        const result = response as { searchCount: number };
        triggerSearchAnimation(
          result.searchCount || 1,
          `/kanji/${composedWord}`,
        );
        setComposedWord("");
        handleClearCanvas();
      }
    } catch (error) {
      console.error("Failed to save word:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto space-y-4">
      {/* Composed Word Input Area */}
      <div className="flex w-full gap-3">
        <div className="relative flex-1 group">
          <PenLine
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-600 dark:group-focus-within:text-zinc-300 transition-colors"
            size={18}
          />
          <input
            type="text"
            value={composedWord}
            onChange={(e) => setComposedWord(e.target.value)}
            placeholder="Write Kanji..."
            className="w-full pl-11 pr-11 h-13 bg-zinc-100 dark:bg-zinc-900 rounded-2xl text-lg focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-800 transition-all outline-none border border-zinc-200/20 dark:border-zinc-800 shadow-sm"
          />
          {composedWord && (
            <button
              onClick={() => setComposedWord("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <Button
          onClick={handleSearchAndSave}
          disabled={!composedWord.trim() || isSaving}
          className="px-6 rounded-2xl shadow-md transition-all active:scale-95 h-13 cursor-pointer bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 border-none"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" strokeWidth={2.5} />
          )}
        </Button>
      </div>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="relative w-full aspect-square bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-inner overflow-hidden text-black dark:text-white"
        style={{ touchAction: "none" }}
      >
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
          className="absolute inset-0 cursor-crosshair w-full h-full"
        />

        {/* Action overlay */}
        <div className="absolute top-2 right-2 flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="w-8 h-8 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur cursor-pointer"
            onClick={handleUndo}
            disabled={traces.length === 0}
          >
            <Undo size={16} />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="w-8 h-8 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur text-red-400 cursor-pointer"
            onClick={handleClearCanvas}
            disabled={traces.length === 0}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      {/* Candidates Area */}
      <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 min-h-30 shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-zinc-500">
            Recognized Kanji
          </h3>
          {isRecognizing && (
            <Loader2 size={14} className="animate-spin text-zinc-400" />
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-auto">
          {candidates.length > 0 ? (
            candidates.map((kanji, i) => (
              <button
                key={i}
                onClick={() => handleSelectKanji(kanji)}
                className="flex items-center justify-center p-3 text-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl transition-colors relative active:scale-95 cursor-pointer"
              >
                {kanji}
              </button>
            ))
          ) : (
            <div className="w-full py-6 text-center text-zinc-400 text-sm italic">
              Draw a Kanji above to see results.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
