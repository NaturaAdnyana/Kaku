"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Undo, Trash2, Loader2, Search, X, PenLine } from "lucide-react";
import { saveWord } from "@/app/actions/kanji";
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

  const handleSearchAndSave = () => {
    if (!composedWord.trim() || isSaving) return;

    setIsSaving(true);
    
    // 1. Kick off DB save in BACKGROUND (do not await)
    const savePromise = saveWord(composedWord).then((response) => {
      if ("success" in response && response.success) {
        queryClient.invalidateQueries({ queryKey: ["kanji-list"] });
        queryClient.invalidateQueries({ queryKey: ["word-list"] });
      }
      return response;
    }).finally(() => {
      setIsSaving(false);
    });

    // 2. Trigger UI transition IMMEDIATELY
    triggerSearchAnimation(`/kanji/${composedWord}`, savePromise, composedWord);
    
    setComposedWord("");
    handleClearCanvas();
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto space-y-4">
      {/* Composed Word Input Area */}
      <div className="flex w-full bg-blank border-2 border-border rounded-base shadow-[4px_4px_0_var(--border)] focus-within:ring-4 focus-within:ring-main focus-within:translate-x-[4px] focus-within:translate-y-[4px] focus-within:shadow-none transition-all group overflow-hidden">
        <div className="relative flex-1 flex items-center">
          <PenLine
            className="absolute left-4 text-muted-foreground group-focus-within:text-main transition-colors"
            size={20}
          />
          <input
            type="text"
            value={composedWord}
            onChange={(e) => setComposedWord(e.target.value)}
            placeholder="Write Kanji..."
            className="w-full pl-12 pr-10 h-[56px] bg-transparent text-lg outline-none font-bold placeholder:font-medium placeholder:text-muted-foreground/50"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearchAndSave();
            }}
          />
          {composedWord && (
            <button
              onClick={() => setComposedWord("")}
              className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <button
          onClick={handleSearchAndSave}
          disabled={!composedWord.trim() || isSaving}
          className="px-6 h-[56px] bg-main text-main-foreground border-l-2 border-border flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-main/90"
          aria-label="Search"
        >
          {isSaving ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Search className="w-6 h-6" strokeWidth={3} />
          )}
        </button>
      </div>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="relative w-full aspect-square bg-blank border-2 border-border rounded-base shadow-shadow overflow-hidden text-foreground"
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
            variant="neutral"
            size="icon"
            className="w-10 h-10 rounded-full cursor-pointer backdrop-blur"
            onClick={handleUndo}
            disabled={traces.length === 0}
          >
            <Undo size={18} />
          </Button>
          <Button
            size="icon"
            className="w-10 h-10 rounded-full text-white cursor-pointer backdrop-blur bg-danger hover:bg-danger/80"
            onClick={handleClearCanvas}
            disabled={traces.length === 0}
          >
            <Trash2 size={18} />
          </Button>
        </div>
      </div>

      {/* Candidates Area */}
      <div className="w-full bg-blank border-2 border-border rounded-base p-5 shadow-shadow flex flex-col min-h-[140px]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
                className="flex items-center justify-center p-3 text-2xl bg-secondary border-2 border-border text-foreground rounded-base shadow-[2px_2px_0px_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all cursor-pointer font-jp"
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
