import type { CurvePoint } from './types';

export function toCurve(points: ReadonlyArray<readonly [number, number]>): CurvePoint[] {
  return points.map(([interactivity, tps]) => ({ interactivity, tps }));
}

export function validateCurve(points: readonly CurvePoint[]): void {
  if (points.length < 2) throw new Error('curve needs at least two points');
  for (let k = 0; k < points.length; k++) {
    const p = points[k];
    if (!(p.interactivity > 0) || !(p.tps > 0)) throw new Error('curve points must be positive');
    if (k > 0 && !(p.interactivity > points[k - 1].interactivity)) {
      throw new Error('curve points must be sorted by interactivity with distinct values');
    }
  }
}

export function curveBounds(points: readonly CurvePoint[]): [number, number] {
  return [points[0].interactivity, points[points.length - 1].interactivity];
}

/** Log-linear interpolation of output tok/s per GPU at serving speed I, clamped to the curve range. */
export function throughputAt(points: readonly CurvePoint[], interactivity: number): number {
  validateCurve(points);
  if (!Number.isFinite(interactivity)) throw new Error('interactivity must be finite');
  const [lo, hi] = curveBounds(points);
  const x = Math.min(Math.max(interactivity, lo), hi);
  for (let k = 1; k < points.length; k++) {
    const a = points[k - 1];
    const b = points[k];
    if (x <= b.interactivity) {
      const f = (x - a.interactivity) / (b.interactivity - a.interactivity);
      return Math.exp(Math.log(a.tps) + f * (Math.log(b.tps) - Math.log(a.tps)));
    }
  }
  return points[points.length - 1].tps;
}

/** InferenceX formula: $/M tokens = $/GPU-hr × 1e6 / (3600 × tok/s/GPU). */
export function costPerMillion(usdPerGpuHr: number, tps: number): number {
  return (usdPerGpuHr * 1e6) / (3600 * tps);
}

/** Output tok/s per GPU needed, sustained 24×7, to earn a yearly revenue at a given output price. */
export function impliedTps(revenueUsdPerYear: number, priceOutUsdPerM: number, gpus: number): number {
  return ((revenueUsdPerYear / priceOutUsdPerM) * 1e6) / gpus / (365 * 86400);
}
