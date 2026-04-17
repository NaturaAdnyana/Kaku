import { useState, useEffect } from "react";

const cache = new Map<string, object | Promise<object>>();

async function fetchAnimation(path: string): Promise<object> {
  const hit = cache.get(path);
  if (hit instanceof Promise) return hit;
  if (hit) return hit;

  const promise = fetch(path)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
      return res.json() as Promise<object>;
    })
    .then((data) => {
      cache.set(path, data);
      return data;
    })
    .catch((err) => {
      cache.delete(path);
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

interface LottieAnimationState {
  path: string | null;
  animationData: object | null;
  isLoading: boolean;
  error: Error | null;
}

export function useLottieAnimation(filename: string | null): UseLottieAnimationResult {
  const [state, setState] = useState<LottieAnimationState>({
    path: null,
    animationData: null,
    isLoading: false,
    error: null,
  });
  const path = filename ? `/animations/${filename}` : null;

  useEffect(() => {
    if (!path) {
      return;
    }

    let cancelled = false;

    const cached = cache.get(path);
    const pendingAnimation =
      cached && !(cached instanceof Promise)
        ? Promise.resolve(cached)
        : fetchAnimation(path);

    pendingAnimation
      .then((data) => {
        if (!cancelled) {
          setState({
            path,
            animationData: data,
            isLoading: false,
            error: null,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(`[useLottieAnimation] ${err.message}`);
          setState({
            path,
            animationData: null,
            isLoading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!path) {
    return { animationData: null, isLoading: false, error: null };
  }

  if (state.path !== path) {
    return { animationData: null, isLoading: true, error: null };
  }

  return {
    animationData: state.animationData,
    isLoading: state.isLoading,
    error: state.error,
  };
}
