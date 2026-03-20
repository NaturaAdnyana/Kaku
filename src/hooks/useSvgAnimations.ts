import { useState, useEffect } from "react";
import { isKanji } from "@/lib/utils";

interface AnimationData {
  char: string;
  svgContent: string;
}

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
    let isMounted = true;
    setLoading(true);

    const chars = Array.from(word).filter(isKanji);

    const fetchAll = async () => {
      const promises = chars.map(async (char): Promise<AnimationData | null> => {
        const unicode = char.charCodeAt(0);
        const url = `https://cdn.jsdelivr.net/gh/parsimonhi/animCJK@master/svgsJa/${unicode}.svg`;
        try {
          const res = await fetch(url);
          if (res.ok) {
            const svgText = await res.text();
            if (svgText.includes("<svg")) {
              return { char, svgContent: svgText };
            }
          }
        } catch {
          // ignore – CDN may not have this character
        }
        return null;
      });

      const results = await Promise.all(promises);
      const valid = results.filter(
        (r): r is AnimationData => r !== null,
      );

      if (isMounted) {
        setAnimations(valid);
        setLoading(false);
      }
    };

    if (chars.length === 0) {
      setAnimations([]);
      setLoading(false);
    } else {
      fetchAll();
    }

    return () => {
      isMounted = false;
    };
  }, [word]);

  return { animations, loading };
}
