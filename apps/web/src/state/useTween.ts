import { useEffect, useRef, useState } from 'react';

const DURATION_MS = 160;

const reducedMotion = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Eases a list of numbers toward its latest value over a few frames, so figures and marks glide to a new setting instead of snapping.
 * The first render shows the exact values, as does every render when the reader prefers reduced motion.
 */
export function useTween(target: number[], ms = DURATION_MS): number[] {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);
  const raf = useRef(0);
  const key = target.join('|');
  useEffect(() => {
    const from = shownRef.current;
    if (from === target) return;
    if (reducedMotion() || from.length !== target.length) {
      shownRef.current = target;
      setShown(target);
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - (1 - t) ** 3;
      const next = t >= 1 ? target : from.map((a, k) => a + (target[k] - a) * eased);
      shownRef.current = next;
      setShown(next);
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
    // The joined key stands in for the array, which is rebuilt every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ms]);
  return shown;
}
