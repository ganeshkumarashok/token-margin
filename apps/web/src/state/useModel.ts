import { useEffect, useMemo, useState } from 'react';
import {
  clampInteractivity, curveFor, defaultSettings, demandShare, evaluate, inputsFromSettings, rentFor, sellPrices,
  type Settings,
} from '@token-margin/engine';
import { A } from '../data';
import { parseUrl, toSearch } from './url';

/** Operating profit per day for a settings object. */
export function profitOf(s: Settings): number {
  return evaluate(inputsFromSettings(A, s), curveFor(A, s.rack)).daily.operatingProfitUsd;
}

/**
 * Value of one numeric setting at which the day's profit crosses zero, holding the rest fixed.
 * Scans the range for the first sign change, then bisects. null when profit keeps one sign.
 */
export function breakEven(s: Settings, key: keyof Settings, lo: number, hi: number): number | null {
  const f = (v: number) => profitOf({ ...s, [key]: v });
  const n = 48;
  let a = lo;
  let fa = f(a);
  for (let k = 1; k <= n; k++) {
    const b = lo + ((hi - lo) * k) / n;
    const fb = f(b);
    if (fa === 0) return a;
    if (Math.sign(fa) !== Math.sign(fb)) {
      let x0 = a;
      let x1 = b;
      for (let j = 0; j < 40; j++) {
        const m = (x0 + x1) / 2;
        if (Math.sign(f(m)) === Math.sign(fa)) x0 = m;
        else x1 = m;
      }
      return (x0 + x1) / 2;
    }
    a = b;
    fa = fb;
  }
  return null;
}

export function useModel() {
  const [settings, setSettings] = useState<Settings>(() => parseUrl(A, window.location.search));

  useEffect(() => {
    const t = window.setTimeout(() => {
      window.history.replaceState(null, '', `${window.location.pathname}${toSearch(A, settings)}${window.location.hash}`);
    }, 150);
    return () => window.clearTimeout(t);
  }, [settings]);

  const derived = useMemo(() => {
    const points = curveFor(A, settings.rack);
    const inputs = inputsFromSettings(A, settings);
    const result = evaluate(inputs, points);
    const demand = demandShare(result.daily, {
      openrouterTokensPerDay: A.anchors.openrouterTokensPerDay.value,
      deepseekTokensPerDay: A.anchors.deepseekTokensPerDay.value,
    });
    return { points, inputs, result, demand, rent: rentFor(A, settings), prices: sellPrices(A, settings) };
  }, [settings]);

  const update = (patch: Partial<Settings>) =>
    setSettings((s) => {
      const next = { ...s, ...patch };
      if (patch.rack && patch.rack !== s.rack) next.interactivity = clampInteractivity(A, patch.rack, next.interactivity);
      return next;
    });

  const reset = () => setSettings(defaultSettings(A));
  const isDefault = toSearch(A, settings) === '';

  return { settings, update, reset, isDefault, ...derived };
}

export type Model = ReturnType<typeof useModel>;
