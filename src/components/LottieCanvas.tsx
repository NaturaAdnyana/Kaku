"use client";

/**
 * LottiePlayer
 *
 * Drives lottie-web directly (SVG renderer) with performance tuning:
 *  - setSubframe(false) — skips between-frame interpolation math (big CPU win)
 *  - Optional maxFps cap — throttles the RAF loop (reduces SVG mutations/sec)
 *  - Session-level cache via useLottieAnimation (no re-fetches on remount)
 *
 * NOTE: canvas renderer was tested but caused broken rendering on animations
 * that use precomp layers with blend modes. SVG has better spec coverage.
 */

import { useEffect, useRef } from "react";
import lottie, { AnimationItem } from "lottie-web";

interface LottiePlayerProps {
  animationData: object;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  /**
   * Cap playback framerate (e.g. 15 for mobile).
   * If omitted the animation runs at its native fps (25 for your files).
   * Lower values = fewer SVG mutations per second = less CPU/GPU on mobile.
   */
  maxFps?: number;
  /** Called once when a non-looping animation finishes */
  onComplete?: () => void;
}

export function LottiePlayer({
  animationData,
  loop = true,
  autoplay = true,
  className,
  maxFps,
  onComplete,
}: LottiePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Cancel any custom FPS loop from a previous instance
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    animRef.current?.destroy();

    animRef.current = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop,
      autoplay: maxFps ? false : autoplay, // we'll drive playback ourselves if throttling
      animationData,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid meet",
        progressiveLoad: true,
      },
    });

    // Skip between-frame interpolation — largest single CPU saving on mobile.
    // Instead of computing a tweened state between frame 3 and 4, lottie snaps
    // to the nearest integer frame. Barely visible, significant CPU reduction.
    animRef.current.setSubframe(false);

    if (onComplete) {
      animRef.current.addEventListener("complete", onComplete);
    }

    // Custom FPS throttle — drives the animation via goToAndStop at maxFps
    // instead of letting lottie-web fire on every requestAnimationFrame (25fps).
    if (maxFps && autoplay) {
      const anim = animRef.current;
      const totalFrames = anim.totalFrames;
      const nativeFps = totalFrames / anim.getDuration();
      const msPerTargetFrame = 1000 / maxFps;

      let lastTimestamp = 0;
      let currentFrame = 0;

      const tick = (timestamp: number) => {
        const elapsed = timestamp - lastTimestamp;

        if (elapsed >= msPerTargetFrame) {
          const framesElapsed = (elapsed / 1000) * nativeFps;
          currentFrame += framesElapsed;

          if (loop) {
            currentFrame = currentFrame % totalFrames;
          } else if (currentFrame >= totalFrames - 1) {
            anim.goToAndStop(totalFrames - 1, true);
            onComplete?.();
            return; // stop the loop
          }

          anim.goToAndStop(Math.floor(currentFrame), true);
          lastTimestamp = timestamp;
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      animRef.current?.destroy();
      animRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationData]);

  // Sync loop/autoplay changes without reloading
  useEffect(() => {
    if (!animRef.current || maxFps) return; // custom loop handles itself
    animRef.current.loop = loop;
    if (autoplay) animRef.current.play();
    else animRef.current.pause();
  }, [loop, autoplay, maxFps]);

  return <div ref={containerRef} className={className} />;
}
