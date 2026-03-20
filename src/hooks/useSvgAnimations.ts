import { useState, useEffect } from "react";
import { isKanji } from "@/lib/utils";

interface AnimationData {
  char: string;
  svgContent: string;
}

const animationCache = new Map<string, string | null>();

/**
 * Shared hook that fetches stroke-order SVG animations for each kanji
 * character in the given word. Results are fetched concurrently via
 * Promise.all – the browser HTTP cache naturally deduplicates repeated
 * requests for the same character across renders / components.
 */
export function useSvgAnimations(word: string): {
  animations: AnimationData[];
  loading: boolean;
} {
  const [animations, setAnimations] = useState<AnimationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const chars = Array.from(new Set(Array.from(word).filter(isKanji)));

    if (chars.length === 0) {
      setAnimations([]);
      setLoading(false);
      return () => {
        active = false;
        controller.abort();
      };
    }

    setLoading(true);

    const fetchAll = async () => {
      try {
        const promises = chars.map(
          async (char): Promise<AnimationData | null> => {
            if (animationCache.has(char)) {
              const cachedSvg = animationCache.get(char);
              return cachedSvg ? { char, svgContent: cachedSvg } : null;
            }

            const codePoint = char.codePointAt(0);
            if (!codePoint) {
              animationCache.set(char, null);
              return null;
            }

            const url = `https://cdn.jsdelivr.net/gh/parsimonhi/animCJK@master/svgsJa/${codePoint}.svg`;
            try {
              const res = await fetch(url, { signal: controller.signal });
              if (!res.ok) {
                if (res.status === 404) {
                  animationCache.set(char, null);
                }
                return null;
              }

              const svgText = await res.text();
              if (!svgText.includes("<svg")) {
                animationCache.set(char, null);
                return null;
              }

              animationCache.set(char, svgText);
              return { char, svgContent: svgText };
            } catch {
              // Ignore network/CDN errors and do not poison cache for transient failures.
              return null;
            }
          },
        );

        const results = await Promise.all(promises);
        const validResults = results.filter(
          (result): result is AnimationData => result !== null,
        );

        if (active) {
          setAnimations(validResults);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchAll();

    return () => {
      active = false;
      controller.abort();
    };
  }, [word]);

  return { animations, loading };
}
