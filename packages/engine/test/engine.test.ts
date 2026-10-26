import { describe, expect, it } from 'vitest';
import {
  applyPreset, breakevens, costPerMillion, daily, demandShare, evaluate, impliedTps, schedule, sensitivity, throughputAt,
} from '../src';
import { A, gb200, gb300, inputs, own, presetInputs, rent, settings } from './helpers';

const anchors = { openrouterTokensPerDay: A.anchors.openrouterTokensPerDay.value, deepseekTokensPerDay: A.anchors.deepseekTokensPerDay.value };
const near = (v: number | null, want: number, tol: number) => {
  expect(v).not.toBeNull();
  expect(Math.abs((v as number) - want)).toBeLessThanOrEqual(tol);
};

describe('T1 throughputAt (InferenceX AgentX, output tok/s per GPU incl. prefill)', () => {
  it('hits measured points, interpolates log-linearly, clamps to the measured range', () => {
    near(throughputAt(gb200, 94.7), 312.2, 1e-9);
    near(throughputAt(gb200, 95), 310.8495, 1e-3);
    near(throughputAt(gb200, 100), 289.182, 1e-3);
    near(throughputAt(gb200, 60), 312.2, 1e-9);
    near(throughputAt(gb200, 400), 49.9, 1e-9);
    near(throughputAt(gb300, 95), 391.6486, 1e-3);
  });
});

describe('T2 validation against InferenceX', () => {
  it('benchmark-shaped traffic reproduces every published agentic point on both racks', () => {
    for (const [rack, curve] of [['gb200', gb200], ['gb300', gb300]] as const) {
      const ref = A.curves[rack].refUncachedPerOut;
      for (const p of curve) {
        const d = daily(rent({ rack, interactivity: p.interactivity, islOsl: ref, cacheHit: 0, utilization: 1 }), curve);
        near(d.capacityPerGpu, p.tps, 1e-9);
      }
    }
  });
  it('cost per million output tokens at the SemiAnalysis owning TCO', () => {
    near(costPerMillion(1.86, 312.2), 1.6549, 1e-4);
  });
  it('stays below the independent 8K/1K benchmark (short context decodes faster) but within 2x', () => {
    // InferenceX fixed 8K/1K, GLM-5.1 on GB200 at 104 tok/s/user: 392 output tok/s per GPU incl. prefill.
    const d = daily(rent({ interactivity: 104, islOsl: 8, cacheHit: 0, utilization: 1 }), gb200);
    expect(d.capacityPerGpu).toBeLessThan(392);
    expect(d.capacityPerGpu).toBeGreaterThan(392 / 2);
  });
});

describe('T3 pitch: fastest measured point, everything sold, list price, owning', () => {
  const i = presetInputs('pitch', { tenure: 'own' });
  const d = daily(i, gb200);
  it('daily figures', () => {
    expect(i.interactivity).toBe(94.7);
    near(d.benchPerGpu, 312.2, 1e-9);
    near(d.capacityPerGpu, 277.0601, 1e-3);
    near(d.outputTokens, 1.723535587e9, 1e3);
    near(d.revenueUsd, 48_193.5, 0.1);
    near(d.electricityUsd, 502.16, 0.01);
    near(d.coloUsd, 789.04, 0.01);
    near(d.otherOpexUsd, 534.25, 0.01);
    near(d.depreciationUsd, 2404.11, 0.01);
    near(d.fullCostPerMOut, 2.454, 0.001);
    near(d.revenuePerGpuHr, 27.89, 0.01);
  });
  it('pays back in month 3 with no price decline', () => {
    expect(schedule(i, d).paybackMonth).toBe(3);
  });
});

describe('T4 defaults: GB200, 95 tok/s/user, 70% sold, median FP4 price, OpenRouter mix', () => {
  it('renting on demand (the default)', () => {
    const i = inputs();
    expect(i.tenure).toBe('rent');
    expect(i.rentUsdPerGpuHr).toBe(10.5);
    expect(i.prefillRate).toBe(3200);
    expect(i.refUncachedPerOut).toBe(5);
    const { daily: d, schedule: s } = evaluate(i, gb200);
    near(d.benchPerGpu, 310.8495, 1e-3);
    near(d.capacityPerGpu, 275.996, 1e-3);
    expect(d.tpsPerGpu).toBe(d.capacityPerGpu);
    near(d.outputTokens, 1.2018411e9, 1e3);
    near(d.inputTokens, 75.715992e9, 1e4);
    near(d.revenueUsd, 23_308.51, 0.01);
    near(d.inputRevenueUsd, 18_020.41, 0.01);
    expect(d.capexUsd).toBe(0);
    near(d.rentUsd, 18_144, 1e-6);
    expect(d.electricityUsd).toBe(0);
    expect(d.coloUsd).toBe(0);
    expect(d.depreciationUsd).toBe(0);
    near(d.operatingProfitUsd, 5164.51, 0.01);
    near(d.operatingMargin, 0.2216, 1e-4);
    near(d.revenuePerGpuHr, 13.4887, 1e-4);
    expect(s.paybackMonth).toBeNull();
    expect(s.underwaterMonth).toBe(6);
    near(s.npvUsd, 404_412, 10);
    expect(s.irr).toBeNull();
    expect(s.flows).toHaveLength(49);
    expect(s.flows[0]).toBe(0);
    expect(s.flows[5]).toBeGreaterThan(0);
    for (let m = 6; m <= 48; m++) expect(s.flows[m]).toBe(0);
  });
  it('renting on a large contract', () => {
    const i = inputs({ rentBasis: 'contract' });
    expect(i.rentUsdPerGpuHr).toBe(4.4);
    const { daily: d, schedule: s } = evaluate(i, gb200);
    near(d.rentUsd, 7603.2, 1e-6);
    near(d.operatingProfitUsd, 15_705.31, 0.01);
    near(d.operatingMargin, 0.6738, 1e-4);
    expect(s.underwaterMonth).toBe(21);
    near(s.npvUsd, 3_884_834, 10);
  });
  it('an explicit rent overrides the basis', () => {
    expect(inputs({ rentBasis: 'contract', rentUsdPerGpuHr: 7 }).rentUsdPerGpuHr).toBe(7);
  });
  it('owning a GB200 rack', () => {
    const { daily: d, schedule: s } = evaluate(own(), gb200);
    near(d.capexUsd, 3_900_000, 1e-6);
    near(d.revenueUsd, 23_308.51, 0.01);
    near(d.electricityUsd, 404.24, 0.01);
    near(d.costUsd, 4131.63, 0.01);
    near(d.operatingProfitUsd, 19_176.87, 0.01);
    near(d.operatingMargin, 0.8227, 1e-4);
    near(d.fullCostPerMOut, 3.4378, 1e-4);
    expect(s.paybackMonth).toBe(8);
    expect(s.underwaterMonth).toBe(47);
    near(s.npvUsd, 5_122_581, 100);
    near(s.irr, 2.3215, 0.01);
  });
  it('T4b GB300: on demand, contract, own', () => {
    const r = evaluate(rent({ rack: 'gb300' }), gb300);
    expect(r.inputs.rentUsdPerGpuHr).toBe(12.42);
    near(r.daily.capacityPerGpu, 337.8881, 1e-3);
    near(r.daily.revenueUsd, 28_535.44, 0.01);
    near(r.daily.rentUsd, 21_461.76, 1e-6);
    near(r.daily.operatingProfitUsd, 7073.68, 0.01);
    expect(r.schedule.underwaterMonth).toBe(6);
    const c = evaluate(rent({ rack: 'gb300', rentBasis: 'contract' }), gb300);
    near(c.daily.operatingProfitUsd, 19_895.44, 0.01);
    const o = evaluate(own({ rack: 'gb300' }), gb300);
    expect(o.schedule.paybackMonth).toBe(8);
    near(o.schedule.npvUsd, 6_212_819, 100);
  });
  it('T4c rent on demand with everything sold', () => {
    const d = daily(rent({ utilization: 1 }), gb200);
    near(d.outputTokens, 1.7169159e9, 1e3);
    near(d.revenueUsd, 33_297.87, 0.01);
    near(d.operatingMargin, 0.4551, 1e-4);
  });
});

describe('T5 bear preset: 80% achieved, 50% sold, low price', () => {
  it('owning: never pays back, NPV negative', () => {
    const { daily: d, schedule: s } = evaluate(presetInputs('bear', { tenure: 'own' }), gb200);
    near(d.revenueUsd, 9018.1, 0.01);
    near(d.cashMargin, 0.8157, 1e-4);
    near(d.operatingMargin, 0.5491, 1e-4);
    expect(s.paybackMonth).toBeNull();
    expect(s.underwaterMonth).toBe(18);
    near(s.npvUsd, -3_026_722, 100);
    near(s.irr, -0.7528, 0.005);
  });
  it('renting: loses money from day one, so the renter never starts', () => {
    const { daily: d, schedule: s } = evaluate(presetInputs('bear'), gb200);
    near(d.operatingProfitUsd, -9125.9, 0.01);
    expect(s.underwaterMonth).toBe(1);
    expect(s.npvUsd).toBe(0);
    expect(s.flows.every((f) => f === 0)).toBe(true);
    expect(breakevens(presetInputs('bear'), gb200).soldShareToBreakEven).toBeNull();
  });
});

describe('T6 break-evens', () => {
  it('price level × output price equals full cost per M output when there is no input revenue', () => {
    const i = own({ interactivity: 94.7, achieved: 1, utilization: 1, pricePreset: 'list', islOsl: 0 });
    near(breakevens(i, gb200).outPriceUsdPerM, 1.11544, 1e-4);
    near(daily(i, gb200).fullCostPerMOut, 1.11544, 1e-4);
  });
  it('share sold to break even: 54% on demand, 23% on contract, 12% owning, and profit is ~0 there', () => {
    const br = breakevens(rent(), gb200);
    near(br.soldShareToBreakEven, 0.5449, 1e-3);
    near(daily({ ...rent(), utilization: br.soldShareToBreakEven! }, gb200).operatingProfitUsd, 0, 1);
    const bo = breakevens(own(), gb200);
    near(bo.soldShareToBreakEven, 0.1184, 1e-3);
    near(breakevens(rent({ rentBasis: 'contract' }), gb200).soldShareToBreakEven, 0.2283, 1e-3);
    near(daily({ ...own(), utilization: bo.soldShareToBreakEven! }, gb200).operatingProfitUsd, 0, 1);
  });
  it('break-even utilization and decline bracket the owning defaults sensibly', () => {
    const b = breakevens(own(), gb200);
    expect(b.utilizationForPaybackAtLife).not.toBeNull();
    expect(b.utilizationForPaybackAtLife!).toBeLessThan(0.6);
    expect(b.priceDeclineForPaybackAtLife).not.toBeNull();
    expect(b.priceDeclineForPaybackAtLife!).toBeGreaterThan(0.5);
    const at = evaluate(own({ utilization: b.utilizationForPaybackAtLife! }), gb200).schedule;
    expect(at.paybackMonth).not.toBeNull();
    const below = evaluate(own({ utilization: b.utilizationForPaybackAtLife! * 0.98 }), gb200).schedule;
    expect(below.paybackMonth).toBeNull();
  });
  it('price level is full cost over revenue under either tenure', () => {
    for (const i of [own(), rent()]) {
      const d = daily(i, gb200);
      const b = breakevens(i, gb200);
      near(b.priceLevel, d.costUsd / d.revenueUsd, 1e-12);
      const lvl = b.priceLevel!;
      const z = daily({ ...i, priceInUsdPerM: i.priceInUsdPerM * lvl, priceCacheUsdPerM: i.priceCacheUsdPerM * lvl, priceOutUsdPerM: i.priceOutUsdPerM * lvl }, gb200);
      near(z.operatingProfitUsd, 0, 1e-6);
    }
    near(breakevens(own(), gb200).priceLevel, 0.1773, 0.001);
    near(breakevens(rent(), gb200).priceLevel, 0.7784, 0.001);
  });
  it('NPV break-even decline: NPV ~0 there; the bear owner breaks even only if prices fall < ~36%/yr', () => {
    const i = own({ achieved: 0.25 });
    const b = breakevens(i, gb200);
    expect(b.priceDeclineForZeroNpv).not.toBeNull();
    const s = evaluate({ ...i, priceDeclinePerYear: b.priceDeclineForZeroNpv! }, gb200).schedule;
    expect(Math.abs(s.npvUsd)).toBeLessThan(5000);
    const bear = presetInputs('bear', { tenure: 'own' });
    const bb = breakevens(bear, gb200).priceDeclineForZeroNpv;
    near(bb, 0.3558, 0.002);
    expect(Math.abs(evaluate({ ...bear, priceDeclinePerYear: bb! }, gb200).schedule.npvUsd)).toBeLessThan(5000);
  });
  it('bear case has no utilization that pays back', () => {
    expect(breakevens(presetInputs('bear', { tenure: 'own' }), gb200).utilizationForPaybackAtLife).toBeNull();
  });
});

describe('T7 revenue logic reproduces DeepSeek Feb-2025 day', () => {
  it('theoretical revenue and cost', () => {
    const k = A.anchors.deepseekDay;
    const cached = k.inputTokens * (342 / 608);
    const rev = (k.outputTokens * k.priceOutUsdPerM + (k.inputTokens - cached) * k.priceInUsdPerM + cached * k.priceCacheUsdPerM) / 1e6;
    expect(Math.abs(rev - k.reportedRevenueUsd) / k.reportedRevenueUsd).toBeLessThan(0.01);
    expect(k.gpus * 24 * k.costUsdPerGpuHr).toBe(k.reportedCostUsd);
  });
});

describe('T8 NVIDIA claim back-solve', () => {
  it('~5,505 output tok/s per GPU', () => {
    const c = A.anchors.nvidiaClaim;
    near(impliedTps(c.revenueUsd / c.years, c.priceOutUsdPerM, c.gpus), 5505, 1);
  });
});

describe('T9 demand share', () => {
  it('defaults move ~0.9% of what OpenRouter serves in a day', () => {
    const ds = demandShare(daily(inputs(), gb200), anchors);
    near(ds.tokensPerDay, 76.9178e9, 1e6);
    near(ds.shareOfOpenRouter, 0.008841, 1e-5);
    near(ds.shareOfDeepSeek2025, 0.09912, 1e-4);
  });
});

describe('T10 lead time', () => {
  it('owning: six months to first revenue', () => {
    const s = evaluate(own({ monthsToRevenue: 6 }), gb200).schedule;
    expect(s.paybackMonth).toBe(20);
    near(s.npvUsd, 1_563_842, 100);
  });
  it('renting: rent accrues for two idle months, underwater in month 6', () => {
    const s = evaluate(rent({ monthsToRevenue: 2 }), gb200).schedule;
    expect(s.paybackMonth).toBeNull();
    expect(s.underwaterMonth).toBe(6);
    expect(s.flows[1]).toBeLessThan(0);
    near(s.npvUsd, -962_242, 100);
  });
});

describe('T11 zero utilization', () => {
  it('owning: no revenue, idle power only', () => {
    const d = daily(own({ utilization: 0 }), gb200);
    expect(d.revenueUsd).toBe(0);
    expect(d.cashMargin).toBeNull();
    expect(d.operatingMargin).toBeNull();
    expect(d.cashCostPerMOut).toBeNull();
    near(d.electricityUsd, 175.75, 0.1);
    expect(breakevens(own({ utilization: 0 }), gb200).outPriceUsdPerM).toBeNull();
  });
});

describe('T12 properties', () => {
  it('flat flows without decline', () => {
    for (const i of [rent({ priceDeclinePerYear: 0, monthsToRevenue: 2 }), own({ priceDeclinePerYear: 0, monthsToRevenue: 2 })]) {
      const s = evaluate(i, gb200).schedule;
      const after = s.flows.slice(3);
      for (const f of after) expect(f).toBeCloseTo(after[0], 6);
    }
  });
  it('cumulative equals sum of flows', () => {
    const s = evaluate(own(), gb200).schedule;
    const sum = s.flows.reduce((x, y) => x + y, 0);
    expect(s.cumulative[s.months]).toBeCloseTo(sum, 4);
  });
  it('more utilization never delays payback', () => {
    let prev = Infinity;
    for (let u = 0.1; u <= 1.0001; u += 0.05) {
      const p = evaluate(own({ utilization: Math.min(u, 1) }), gb200).schedule.paybackMonth ?? Infinity;
      expect(p).toBeLessThanOrEqual(prev);
      prev = p;
    }
  });
  it('throughput is non-increasing in serving speed', () => {
    for (const c of [gb200, gb300]) {
      let prev = Infinity;
      for (let x = 80; x <= 280; x += 1) {
        const t = throughputAt(c, x);
        expect(t).toBeLessThanOrEqual(prev + 1e-9);
        prev = t;
      }
    }
  });
  it('sensitivity rows sorted by swing; prices and share sold outrank electricity; rent rows match tenure', () => {
    const rows = sensitivity(own(), gb200);
    for (let k = 1; k < rows.length; k++) expect(rows[k].swing).toBeLessThanOrEqual(rows[k - 1].swing);
    const idx = (key: string) => rows.findIndex((r) => r.key === key);
    expect(idx('prices')).toBeLessThan(idx('electricity'));
    expect(idx('utilization')).toBeLessThan(idx('electricity'));
    expect(idx('rent')).toBe(-1);
    const rrows = sensitivity(rent(), gb200);
    expect(rrows.some((r) => r.key === 'rent')).toBe(true);
    expect(rrows.some((r) => r.key === 'electricity')).toBe(false);
    const rentRow = rrows.find((r) => r.key === 'rent')!;
    expect(rentRow.lowProfit).toBeGreaterThan(rentRow.highProfit);
    for (const rack of ['gb200', 'gb300'] as const) {
      const c = rack === 'gb200' ? gb200 : gb300;
      expect(() => sensitivity(rent({ rack }), c)).not.toThrow();
      expect(() => sensitivity(own({ rack }), c)).not.toThrow();
    }
  });
});

describe('T13 validation', () => {
  it('rejects bad inputs', () => {
    expect(() => daily({ ...inputs(), utilization: 1.5 }, gb200)).toThrow();
    expect(() => daily({ ...inputs(), achieved: -0.1 }, gb200)).toThrow();
    expect(() => daily({ ...inputs(), electricityUsdPerKwh: Number.NaN }, gb200)).toThrow();
    expect(() => daily({ ...inputs(), priceDeclinePerYear: 0.99 }, gb200)).toThrow();
    expect(() => daily({ ...inputs(), lifeYears: 0 }, gb200)).toThrow();
    expect(() => daily({ ...inputs(), racks: 0 }, gb200)).toThrow();
    expect(() => daily({ ...inputs(), prefillRate: 0 }, gb200)).toThrow();
    expect(() => daily({ ...inputs(), rentUsdPerGpuHr: -1 }, gb200)).toThrow();
    expect(() => daily({ ...inputs(), tenure: 'lease' as 'rent' }, gb200)).toThrow();
    expect(() => throughputAt([{ interactivity: 60, tps: 1 }, { interactivity: 50, tps: 2 }], 55)).toThrow();
  });
});

describe('T14 presets', () => {
  it('pitch uses the curve minimum for each rack', () => {
    expect(applyPreset(A, settings({ rack: 'gb200' }), 'pitch').interactivity).toBe(94.7);
    expect(applyPreset(A, settings({ rack: 'gb300' }), 'pitch').interactivity).toBe(89.4);
  });
  it('realistic preset equals defaults and keeps tenure', () => {
    expect(applyPreset(A, settings(), 'realistic')).toEqual(settings());
    expect(applyPreset(A, settings({ tenure: 'own' }), 'pitch').tenure).toBe('own');
  });
});

describe('T15 prefill accounting', () => {
  const peak = (over: Parameters<typeof rent>[0]) => daily(rent({ utilization: 1, ...over }), gb200);
  it('traffic that prefills exactly as much as the benchmark runs at the benchmark rate', () => {
    const d = peak({ islOsl: 50, cacheHit: 0.9 });
    near(d.capacityPerGpu, d.benchPerGpu, 1e-9);
  });
  it('no cache hits make prefill dominate', () => {
    near(peak({ cacheHit: 0 }).capacityPerGpu, 46.856, 1e-3);
  });
  it('more cache hits, shorter prompts and faster prefill GPUs raise capacity', () => {
    near(peak({ cacheHit: 0.95 }).capacityPerGpu, 378.9507, 1e-3);
    near(peak({ islOsl: 20 }).capacityPerGpu, 438.6944, 1e-3);
    near(peak({ prefillRate: 6400 }).capacityPerGpu, 292.3878, 1e-3);
    expect(peak({ cacheHit: 0.95 }).capacityPerGpu).toBeGreaterThan(peak({}).capacityPerGpu);
  });
  it('rejects a prefill rate too slow for the benchmark it was measured with', () => {
    expect(() => peak({ islOsl: 0, prefillRate: 1000 })).toThrow();
    expect(() => peak({ islOsl: 0, prefillRate: 2400 })).not.toThrow();
  });
});

describe('T16 overhead as a share of revenue', () => {
  it('10% overhead on the default day', () => {
    const { daily: d, schedule: s } = evaluate(rent({ overheadPct: 0.1 }), gb200);
    near(d.overheadUsd, 2330.85, 0.01);
    near(d.operatingProfitUsd, 2833.66, 0.01);
    near(d.operatingMargin, 0.1216, 1e-4);
    expect(s.underwaterMonth).toBe(4);
    near(s.npvUsd, 151_817, 10);
    near(breakevens(rent({ overheadPct: 0.1 }), gb200).soldShareToBreakEven, 0.6054, 1e-3);
  });
  it('price level still zeroes profit when overhead scales with revenue', () => {
    const i = rent({ overheadPct: 0.25, rentBasis: 'contract' });
    const lvl = breakevens(i, gb200).priceLevel!;
    const z = daily({ ...i, priceInUsdPerM: i.priceInUsdPerM * lvl, priceCacheUsdPerM: i.priceCacheUsdPerM * lvl, priceOutUsdPerM: i.priceOutUsdPerM * lvl }, gb200);
    near(z.operatingProfitUsd, 0, 1e-6);
  });
  it('defaults carry no overhead', () => {
    expect(inputs().overheadPct).toBe(0);
    expect(() => daily({ ...inputs(), overheadPct: 1 }, gb200)).toThrow();
  });
});
