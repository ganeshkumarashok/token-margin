import { curveBounds } from './curve';
import { daily } from './daily';
import { schedule } from './schedule';
import type { CurvePoint, Inputs } from './types';

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
  lowPayback: number | null;
  highPayback: number | null;
  swing: number;
}

const scalePrices = (i: Inputs, f: number): Inputs => ({
  ...i,
  priceInUsdPerM: i.priceInUsdPerM * f,
  priceCacheUsdPerM: i.priceCacheUsdPerM * f,
  priceOutUsdPerM: i.priceOutUsdPerM * f,
});

export function defaultSensitivitySpecs(points: readonly CurvePoint[]): SensitivitySpec[] {
  const [iMin, iMax] = curveBounds(points);
  return [
    { key: 'rackPrice', label: 'Rack price', lowLabel: '−30%', highLabel: '+30%',
      apply: (i, s) => ({ ...i, rackPriceUsd: i.rackPriceUsd * (s === 'low' ? 0.7 : 1.3) }) },
    { key: 'interactivity', label: 'Serving speed', lowLabel: `${iMin} tok/s`, highLabel: `${iMax} tok/s`,
      apply: (i, s) => ({ ...i, interactivity: s === 'low' ? iMin : iMax }) },
    { key: 'achieved', label: 'Achieved throughput', lowLabel: '25%', highLabel: '100%',
      apply: (i, s) => ({ ...i, achieved: s === 'low' ? 0.25 : 1 }) },
    { key: 'utilization', label: 'Utilization', lowLabel: '30%', highLabel: '100%',
      apply: (i, s) => ({ ...i, utilization: s === 'low' ? 0.3 : 1 }) },
    { key: 'prices', label: 'Token prices', lowLabel: '×0.5', highLabel: '×1.76',
      apply: (i, s) => scalePrices(i, s === 'low' ? 0.5 : 1.76) },
    { key: 'priceDecline', label: 'Price decline', lowLabel: '0%/yr', highLabel: '90%/yr',
      apply: (i, s) => ({ ...i, priceDeclinePerYear: s === 'low' ? 0 : 0.9 }) },
    { key: 'electricity', label: 'Electricity', lowLabel: '5¢', highLabel: '25¢',
      apply: (i, s) => ({ ...i, electricityUsdPerKwh: s === 'low' ? 0.05 : 0.25 }) },
    { key: 'life', label: 'Useful life', lowLabel: '2 yr', highLabel: '6 yr',
      apply: (i, s) => ({ ...i, lifeYears: s === 'low' ? 2 : 6 }) },
  ];
}

export function sensitivity(
  i: Inputs,
  points: readonly CurvePoint[],
  specs: readonly SensitivitySpec[] = defaultSensitivitySpecs(points),
): SensitivityRow[] {
  const run = (x: Inputs) => schedule(x, daily(x, points));
  return specs
    .map((sp) => {
      const lo = run(sp.apply(i, 'low'));
      const hi = run(sp.apply(i, 'high'));
      return {
        key: sp.key,
        label: sp.label,
        lowLabel: sp.lowLabel,
        highLabel: sp.highLabel,
        lowNpv: lo.npvUsd,
        highNpv: hi.npvUsd,
        lowPayback: lo.paybackMonth,
        highPayback: hi.paybackMonth,
        swing: Math.abs(hi.npvUsd - lo.npvUsd),
      };
    })
    .sort((a, b) => b.swing - a.swing);
}
