import { daily } from './daily';
import { schedule } from './schedule';
import type { Breakevens, CurvePoint, DemandShare, Daily, Inputs } from './types';

function paysBackWithinLife(i: Inputs, points: readonly CurvePoint[]): boolean {
  const s = schedule(i, daily(i, points));
  return s.paybackMonth !== null && s.paybackMonth <= s.months;
}

export function breakevens(i: Inputs, points: readonly CurvePoint[]): Breakevens {
  const d = daily(i, points);
  const priceLevel = d.revenueUsd > 0 ? (d.cashCostUsd + d.depreciationUsd) / d.revenueUsd : null;
  // Blended output price at that level (list share included).
  const blendedOut = (1 - i.listShare) * i.priceOutUsdPerM + i.listShare * i.listOutUsdPerM;
  const outPriceUsdPerM = priceLevel === null ? null : priceLevel * blendedOut;

  const npvPositive = (x: Inputs) => schedule(x, daily(x, points)).npvUsd >= 0;
  let priceDeclineForZeroNpv: number | null = null;
  if (npvPositive({ ...i, priceDeclinePerYear: 0 })) {
    let lo = 0;
    let hi = 0.98;
    if (npvPositive({ ...i, priceDeclinePerYear: hi })) lo = hi;
    else {
      for (let k = 0; k < 40; k++) {
        const mid = (lo + hi) / 2;
        if (npvPositive({ ...i, priceDeclinePerYear: mid })) lo = mid;
        else hi = mid;
      }
    }
    priceDeclineForZeroNpv = lo;
  }

  let utilizationForPaybackAtLife: number | null = null;
  if (paysBackWithinLife({ ...i, utilization: 1 }, points)) {
    let lo = 0.001;
    let hi = 1;
    if (paysBackWithinLife({ ...i, utilization: lo }, points)) hi = lo;
    else {
      for (let k = 0; k < 40; k++) {
        const mid = (lo + hi) / 2;
        if (paysBackWithinLife({ ...i, utilization: mid }, points)) hi = mid;
        else lo = mid;
      }
    }
    utilizationForPaybackAtLife = hi;
  }

  let priceDeclineForPaybackAtLife: number | null = null;
  if (paysBackWithinLife({ ...i, priceDeclinePerYear: 0 }, points)) {
    let lo = 0;
    let hi = 0.98;
    if (paysBackWithinLife({ ...i, priceDeclinePerYear: hi }, points)) lo = hi;
    else {
      for (let k = 0; k < 40; k++) {
        const mid = (lo + hi) / 2;
        if (paysBackWithinLife({ ...i, priceDeclinePerYear: mid }, points)) lo = mid;
        else hi = mid;
      }
    }
    priceDeclineForPaybackAtLife = lo;
  }

  return { priceLevel, outPriceUsdPerM, priceDeclineForZeroNpv, utilizationForPaybackAtLife, priceDeclineForPaybackAtLife };
}

export function demandShare(
  d: Daily,
  anchors: { openrouterTokensPerDay: number; deepseekTokensPerDay: number },
): DemandShare {
  const tokensPerDay = d.outputTokens + d.inputTokens;
  return {
    tokensPerDay,
    shareOfOpenRouter: tokensPerDay / anchors.openrouterTokensPerDay,
    shareOfDeepSeek2025: tokensPerDay / anchors.deepseekTokensPerDay,
  };
}
