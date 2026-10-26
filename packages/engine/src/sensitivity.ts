import { curveBounds } from './curve';
import { daily } from './daily';
import { schedule } from './schedule';
import type { CurvePoint, Inputs, Tenure } from './types';

export interface SensitivitySpec {
  key: string;
  label: string;
  lowLabel: string;
  highLabel: string;
  apply: (i: Inputs, side: 'low' | 'high') => Inputs;
}

export interface SensitivityRow {
  key: string;
  label: string;
  lowLabel: string;
  highLabel: string;
  lowNpv: number;
  highNpv: number;
  /** daily operating profit at each end */
  lowProfit: number;
  highProfit: number;
  lowPayback: number | null;
  highPayback: number | null;
  /** |highNpv - lowNpv| */
  swing: number;
}

const scalePrices = (i: Inputs, f: number): Inputs => ({
  ...i,
  priceInUsdPerM: i.priceInUsdPerM * f,
  priceCacheUsdPerM: i.priceCacheUsdPerM * f,
  priceOutUsdPerM: i.priceOutUsdPerM * f,
});

/** One-at-a-time swings. Rows that cannot move the result under the given tenure are left out. */
export function defaultSensitivitySpecs(points: readonly CurvePoint[], tenure: Tenure = 'own'): SensitivitySpec[] {
  const [iMin, iMax] = curveBounds(points);
  const own: SensitivitySpec[] = [
    { key: 'rackPrice', label: 'Rack price', lowLabel: '−30%', highLabel: '+30%',
      apply: (i, s) => ({ ...i, rackPriceUsd: i.rackPriceUsd * (s === 'low' ? 0.7 : 1.3) }) },
    { key: 'electricity', label: 'Electricity', lowLabel: '5¢', highLabel: '25¢',
      apply: (i, s) => ({ ...i, electricityUsdPerKwh: s === 'low' ? 0.05 : 0.25 }) },
  ];
  const rent: SensitivitySpec[] = [
    // large 3-yr contract vs the Oracle on-demand list price
    { key: 'rent', label: 'Rent', lowLabel: '$4.40', highLabel: '$16',
      apply: (i, s) => ({ ...i, rentUsdPerGpuHr: s === 'low' ? 4.4 : 16 }) },
  ];
  const shared: SensitivitySpec[] = [
    { key: 'interactivity', label: 'Serving speed', lowLabel: `${iMin} tok/s`, highLabel: `${iMax} tok/s`,
      apply: (i, s) => ({ ...i, interactivity: s === 'low' ? iMin : iMax }) },
    { key: 'achieved', label: 'Achieved throughput', lowLabel: '25%', highLabel: '100%',
      apply: (i, s) => ({ ...i, achieved: s === 'low' ? 0.25 : 1 }) },
    { key: 'utilization', label: 'Share sold', lowLabel: '30%', highLabel: '100%',
      apply: (i, s) => ({ ...i, utilization: s === 'low' ? 0.3 : 1 }) },
    { key: 'prices', label: 'Token prices', lowLabel: '×0.5', highLabel: '×1.5',
      apply: (i, s) => scalePrices(i, s === 'low' ? 0.5 : 1.5) },
    { key: 'priceDecline', label: 'Price decline', lowLabel: '0%/yr', highLabel: '90%/yr',
      apply: (i, s) => ({ ...i, priceDeclinePerYear: s === 'low' ? 0 : 0.9 }) },
    // ×0.75 is the slowest measured agentic prefill
    { key: 'prefill', label: 'Prefill rate', lowLabel: '×0.75', highLabel: '×2',
      apply: (i, s) => ({ ...i, prefillRate: i.prefillRate * (s === 'low' ? 0.75 : 2) }) },
    { key: 'life', label: 'Useful life', lowLabel: '2 yr', highLabel: '6 yr',
      apply: (i, s) => ({ ...i, lifeYears: s === 'low' ? 2 : 6 }) },
  ];
  return [...(tenure === 'rent' ? rent : own), ...shared];
}

export function sensitivity(
  i: Inputs,
  points: readonly CurvePoint[],
  specs: readonly SensitivitySpec[] = defaultSensitivitySpecs(points, i.tenure),
): SensitivityRow[] {
  const run = (x: Inputs) => {
    const d = daily(x, points);
    return { d, s: schedule(x, d) };
  };
  return specs
    .map((sp) => {
      const lo = run(sp.apply(i, 'low'));
      const hi = run(sp.apply(i, 'high'));
      return {
        key: sp.key,
        label: sp.label,
        lowLabel: sp.lowLabel,
        highLabel: sp.highLabel,
        lowNpv: lo.s.npvUsd,
        highNpv: hi.s.npvUsd,
        lowProfit: lo.d.operatingProfitUsd,
        highProfit: hi.d.operatingProfitUsd,
        lowPayback: lo.s.paybackMonth,
        highPayback: hi.s.paybackMonth,
        swing: Math.abs(hi.s.npvUsd - lo.s.npvUsd),
      };
    })
    .sort((a, b) => b.swing - a.swing);
}
