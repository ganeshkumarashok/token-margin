import { useEffect, useMemo, useState } from 'react';
import {
  clampInteractivity, curveFor, defaultSettings, defaultUtilization, demandShare, evaluate, inputsFromSettings, rentFor, sellPrices,
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

/** How the rack is paid for. Utilization, overhead and a typed rent belong to one mode and do not carry to the others. */
export type Mode = 'onDemand' | 'contract' | 'own';
export interface ModeValues { utilization: number; overheadPct: number; rentUsdPerGpuHr: number | null }
export const modeOf = (s: Settings): Mode => (s.tenure === 'own' ? 'own' : s.rentBasis);
const blankModes = (): Record<Mode, ModeValues> => {
  const d = defaultSettings(A);
  const v = (m: Mode) => ({ utilization: defaultUtilization(A, m), overheadPct: d.overheadPct, rentUsdPerGpuHr: null });
  return { onDemand: v('onDemand'), contract: v('contract'), own: v('own') };
};

/** Settings for another mode: shared market inputs from `s`, that mode's own overhead and rent. */
export function settingsForMode(s: Settings, mode: Mode, modes: Record<Mode, ModeValues>): Settings {
  if (mode === modeOf(s)) return s;
  const own = mode === 'own';
  return { ...s, ...modes[mode], tenure: own ? 'own' : 'rent', rentBasis: own ? s.rentBasis : mode };
}

export function useModel() {
  // The build pre-renders the default view, where there is no window; the browser then reads the URL.
  const [settings, setSettings] = useState<Settings>(() => parseUrl(A, typeof window === 'undefined' ? '' : window.location.search));
  const [modes, setModes] = useState<Record<Mode, ModeValues>>(blankModes);

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

  const update = (patch: Partial<Settings>) => {
    const rackChange = patch.rack !== undefined && patch.rack !== settings.rack;
    // A rent typed for one rack is not a price for the other.
    if (rackChange) setModes((ms) => ({
      onDemand: { ...ms.onDemand, rentUsdPerGpuHr: null },
      contract: { ...ms.contract, rentUsdPerGpuHr: null },
      own: { ...ms.own, rentUsdPerGpuHr: null },
    }));
    setSettings((s) => {
      const next = { ...s, ...patch };
      if (rackChange && patch.rack) {
        next.interactivity = clampInteractivity(A, patch.rack, next.interactivity);
        next.rentUsdPerGpuHr = null;
      }
      return next;
    });
  };

  /** Switch how the rack is paid for, keeping each mode's own overhead and rent. */
  const setMode = (next: Mode) => {
    const cur = modeOf(settings);
    if (next === cur) return;
    const saved = { ...modes, [cur]: { utilization: settings.utilization, overheadPct: settings.overheadPct, rentUsdPerGpuHr: settings.rentUsdPerGpuHr } };
    setModes(saved);
    setSettings(settingsForMode(settings, next, saved));
  };

  const reset = () => {
    setModes(blankModes());
    setSettings(defaultSettings(A));
  };
  const isDefault = toSearch(A, settings) === '';

  return { settings, modes, update, setMode, reset, isDefault, ...derived };
}

export type Model = ReturnType<typeof useModel>;
