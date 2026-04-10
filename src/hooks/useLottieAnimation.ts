/**
 * useLottieAnimation
 *
 * Fetches a Lottie animation JSON from /animations/<filename> with a
 * module-level in-memory cache so the same file is never downloaded more
 * than once per browser session, even across remounts.
 */

import { useState, useEffect } from "react";

// Module-level cache: path → parsed JSON (or in-flight Promise)
const cache = new Map<string, object | Promise<object>>();

async function fetchAnimation(path: string): Promise<object> {
  const hit = cache.get(path);
  if (hit instanceof Promise) return hit;      // already in-flight
  if (hit) return hit;                          // already resolved

  const promise = fetch(path)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
      return res.json() as Promise<object>;
    })
    .then((data) => {
      cache.set(path, data);   // replace promise with resolved value
      return data;
    })
    .catch((err) => {
      cache.delete(path);      // allow retry on failure
      throw err;
    });

  cache.set(path, promise);
  return promise;
}

interface UseLottieAnimationResult {
  animationData: object | null;
  isLoading: boolean;
  error: Error | null;
}

export function useLottieAnimation(filename: string | null): UseLottieAnimationResult {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!filename) {
      setAnimationData(null);
      return;
    }

    const path = `/animations/${filename}`;
    let cancelled = false;

    // Check synchronous cache hit first (avoids a render cycle)
    const cached = cache.get(path);
    if (cached && !(cached instanceof Promise)) {
      setAnimationData(cached);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetchAnimation(path)
      .then((data) => {
        if (!cancelled) {
          setAnimationData(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(`[useLottieAnimation] ${err.message}`);
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [filename]);

  return { animationData, isLoading, error };
}
