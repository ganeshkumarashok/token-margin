import { describe, expect, it } from 'vitest';
import {
  applyPreset, breakevens, costPerMillion, daily, defaultSettings, defaultUtilization, demandShare, evaluate, impliedTps, schedule, sensitivity, throughputAt,
} from '../src';
import { A, ds200, ds300, forModel, gb200, gb300, inputs, own, presetInputs, rent, settings } from './helpers';

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
      const ref = A.models.glm53.curves[rack].refUncachedPerOut;
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
    near(d.capacityPerGpu, 270.0458, 1e-3);
    near(d.outputTokens, 1.6463032e9, 1e3);
    near(d.revenueUsd, 46_033.93, 0.01);
    near(d.electricityUsd, 502.16, 0.01);
    near(d.coloUsd, 789.04, 0.01);
    near(d.otherOpexUsd, 427.4, 0.01);
    near(d.opsUsd, 400, 1e-9);
    near(d.depreciationUsd, 2404.11, 0.01);
    near(d.financingUsd, 660.35, 0.01);
    near(d.fullCostPerMOut, 3.1483, 0.001);
    near(d.revenuePerGpuHr, 26.64, 0.01);
  });
  it('pays back in month 3 with no price decline', () => {
    expect(schedule(i, d).paybackMonth).toBe(3);
  });
});

describe('T4 reference day: GB200, 95 tok/s/user, 70% utilization, median FP4 price, OpenRouter mix', () => {
  it('renting on demand', () => {
    const i = inputs();
    expect(i.tenure).toBe('rent');
    expect(i.rentUsdPerGpuHr).toBe(10.5);
    expect(i.prefillRate).toBe(2600);
    expect(i.refUncachedPerOut).toBe(5);
    const { daily: d, schedule: s } = evaluate(i, gb200);
    near(d.benchPerGpu, 310.8495, 1e-3);
    near(d.capacityPerGpu, 269.035, 1e-3);
    near(d.tpsPerGpu, 263.6541, 1e-3);
    near(d.outputTokens, 1.1480977e9, 1e3);
    near(d.inputTokens, 72.330156e9, 1e4);
    near(d.revenueUsd, 22_266.21, 0.01);
    near(d.inputRevenueUsd, 17_214.58, 0.01);
    expect(d.capexUsd).toBe(0);
    near(d.rentUsd, 18_144, 1e-6);
    expect(d.electricityUsd).toBe(0);
    expect(d.coloUsd).toBe(0);
    expect(d.depreciationUsd).toBe(0);
    near(d.operatingProfitUsd, 4122.21, 0.01);
    near(d.operatingMargin, 0.1851, 1e-4);
    near(d.revenuePerGpuHr, 12.8855, 1e-4);
    expect(s.paybackMonth).toBeNull();
    expect(s.underwaterMonth).toBe(5);
    near(s.npvUsd, 278_138, 10);
    expect(s.irr).toBeNull();
    expect(s.flows).toHaveLength(49);
    expect(s.flows[0]).toBe(0);
    expect(s.flows[4]).toBeGreaterThan(0);
    for (let m = 5; m <= 48; m++) expect(s.flows[m]).toBe(0);
  });
  it('renting on a large contract', () => {
    const i = inputs({ rentBasis: 'contract' });
    expect(i.rentUsdPerGpuHr).toBe(5.85);
    const { daily: d, schedule: s } = evaluate(i, gb200);
    near(d.rentUsd, 10_108.8, 1e-6);
    near(d.operatingProfitUsd, 12_157.41, 0.01);
    near(d.operatingMargin, 0.546, 1e-4);
    expect(s.underwaterMonth).toBe(15);
    near(s.npvUsd, 2_305_178, 10);
  });
  it('an explicit rent overrides the basis', () => {
    expect(inputs({ rentBasis: 'contract', rentUsdPerGpuHr: 7 }).rentUsdPerGpuHr).toBe(7);
  });
  it('owning a GB200 rack', () => {
    const { daily: d, schedule: s } = evaluate(own(), gb200);
    near(d.capexUsd, 3_900_000, 1e-6);
    near(d.revenueUsd, 22_266.21, 0.01);
    near(d.electricityUsd, 404.24, 0.01);
    near(d.otherOpexUsd, 427.4, 0.01);
    near(d.opsUsd, 400, 1e-9);
    near(d.financingUsd, 660.35, 0.01);
    near(d.costUsd, 5085.13, 0.01);
    near(d.operatingProfitUsd, 17_181.08, 0.01);
    near(d.operatingMargin, 0.7716, 1e-4);
    near(d.fullCostPerMOut, 4.4292, 1e-4);
    expect(s.paybackMonth).toBe(8);
    expect(s.underwaterMonth).toBe(43);
    near(s.npvUsd, 4_110_025, 100);
    near(s.irr, 1.8956, 0.01);
  });
  it('T4b GB300: on demand, contract, own', () => {
    const r = evaluate(rent({ rack: 'gb300' }), gb300);
    expect(r.inputs.rentUsdPerGpuHr).toBe(12.42);
    near(r.daily.capacityPerGpu, 337.8881, 1e-3);
    near(r.daily.revenueUsd, 27_964.73, 0.01);
    near(r.daily.rentUsd, 21_461.76, 1e-6);
    near(r.daily.operatingProfitUsd, 6502.97, 0.01);
    expect(r.schedule.underwaterMonth).toBe(6);
    const c = evaluate(rent({ rack: 'gb300', rentBasis: 'contract' }), gb300);
    near(c.daily.operatingProfitUsd, 16_559.93, 0.01);
    const o = evaluate(own({ rack: 'gb300' }), gb300);
    expect(o.schedule.paybackMonth).toBe(8);
    near(o.schedule.npvUsd, 5_408_410, 100);
  });
  it('T4c rent on demand with everything sold', () => {
    const d = daily(rent({ utilization: 1 }), gb200);
    near(d.outputTokens, 1.6401396e9, 1e3);
    near(d.revenueUsd, 31_808.87, 0.01);
    near(d.operatingMargin, 0.4296, 1e-4);
  });
});

describe('T5 bear preset: 80% achieved, 50% sold, low price', () => {
  it('owning: never pays back, NPV negative', () => {
    const { daily: d, schedule: s } = evaluate(presetInputs('bear', { tenure: 'own' }), gb200);
    near(d.revenueUsd, 8614.83, 0.01);
    near(d.cashMargin, 0.773, 1e-4);
    near(d.operatingMargin, 0.4173, 1e-4);
    expect(s.paybackMonth).toBeNull();
    expect(s.underwaterMonth).toBe(16);
    near(s.npvUsd, -3_492_289, 100);
    near(s.irr, -0.8306, 0.005);
  });
  it('renting: loses money from day one, so the renter never starts', () => {
    const { daily: d, schedule: s } = evaluate(presetInputs('bear'), gb200);
    near(d.operatingProfitUsd, -9529.17, 0.01);
    expect(s.underwaterMonth).toBe(1);
    expect(s.npvUsd).toBe(0);
    expect(s.flows.every((f) => f === 0)).toBe(true);
    expect(breakevens(presetInputs('bear'), gb200).soldShareToBreakEven).toBeNull();
  });
});

describe('T6 break-evens', () => {
  it('price level × output price equals full cost per M output when there is no input revenue', () => {
    const i = own({ interactivity: 94.7, achieved: 1, utilization: 1, pricePreset: 'list', islOsl: 0 });
    near(breakevens(i, gb200).outPriceUsdPerM, 1.08823, 1e-4);
    near(daily(i, gb200).fullCostPerMOut, 1.08823, 1e-4);
  });
  it('share sold to break even: 57% on demand, 32% on contract, 15% owning, and profit is ~0 there', () => {
    const br = breakevens(rent(), gb200);
    near(br.soldShareToBreakEven, 0.5704, 1e-3);
    near(daily({ ...rent(), utilization: br.soldShareToBreakEven! }, gb200).operatingProfitUsd, 0, 1);
    const bo = breakevens(own(), gb200);
    near(bo.soldShareToBreakEven, 0.1543, 1e-3);
    near(breakevens(rent({ rentBasis: 'contract' }), gb200).soldShareToBreakEven, 0.3178, 1e-3);
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
    near(breakevens(own(), gb200).priceLevel, 0.2284, 0.001);
    near(breakevens(rent(), gb200).priceLevel, 0.8149, 0.001);
  });
  it('NPV break-even decline: NPV ~0 there; the bear owner breaks even only if prices fall < ~29%/yr', () => {
    const i = own({ achieved: 0.25 });
    const b = breakevens(i, gb200);
    expect(b.priceDeclineForZeroNpv).not.toBeNull();
    const s = evaluate({ ...i, priceDeclinePerYear: b.priceDeclineForZeroNpv! }, gb200).schedule;
    expect(Math.abs(s.npvUsd)).toBeLessThan(5000);
    const bear = presetInputs('bear', { tenure: 'own' });
    const bb = breakevens(bear, gb200).priceDeclineForZeroNpv;
    near(bb, 0.2941, 0.002);
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
  it('defaults move ~0.8% of what OpenRouter serves in a day', () => {
    const ds = demandShare(daily(inputs(), gb200), anchors);
    near(ds.tokensPerDay, 73.4783e9, 1e6);
    near(ds.shareOfOpenRouter, 0.008446, 1e-5);
    near(ds.shareOfDeepSeek2025, 0.09469, 1e-4);
  });
});

describe('T10 lead time', () => {
  it('owning: six months to first revenue', () => {
    const s = evaluate(own({ monthsToRevenue: 6 }), gb200).schedule;
    expect(s.paybackMonth).toBe(23);
    near(s.npvUsd, 730_962, 100);
  });
  it('renting: rent accrues for two idle months, underwater in month 5', () => {
    const s = evaluate(rent({ monthsToRevenue: 2 }), gb200).schedule;
    expect(s.paybackMonth).toBeNull();
    expect(s.underwaterMonth).toBe(5);
    expect(s.flows[1]).toBeLessThan(0);
    near(s.npvUsd, -1_024_415, 100);
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
    expect(applyPreset(A, defaultSettings(A), 'realistic')).toEqual(defaultSettings(A));
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
    near(peak({ cacheHit: 0 }).capacityPerGpu, 39.178, 1e-3);
  });
  it('more cache hits, shorter prompts and faster prefill GPUs raise capacity', () => {
    near(peak({ cacheHit: 0.95 }).capacityPerGpu, 399.1295, 1e-3);
    near(peak({ islOsl: 20 }).capacityPerGpu, 484.697, 1e-3);
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
    near(d.overheadUsd, 2226.62, 0.01);
    near(d.operatingProfitUsd, 1895.59, 0.01);
    near(d.operatingMargin, 0.0851, 1e-4);
    expect(s.underwaterMonth).toBe(3);
    near(s.npvUsd, 80_357, 10);
    near(breakevens(rent({ overheadPct: 0.1 }), gb200).soldShareToBreakEven, 0.6338, 1e-3);
  });
  it('price level still zeroes profit when overhead scales with revenue', () => {
    const i = rent({ overheadPct: 0.25, rentBasis: 'contract' });
    const lvl = breakevens(i, gb200).priceLevel!;
    const z = daily({ ...i, priceInUsdPerM: i.priceInUsdPerM * lvl, priceCacheUsdPerM: i.priceCacheUsdPerM * lvl, priceOutUsdPerM: i.priceOutUsdPerM * lvl }, gb200);
    near(z.operatingProfitUsd, 0, 1e-6);
  });
  it('every way of paying defaults to 65% utilization (one rack cannot hand back part of itself)', () => {
    expect(defaultUtilization(A, 'onDemand')).toBe(0.65);
    expect(defaultUtilization(A, 'contract')).toBe(0.65);
    expect(defaultUtilization(A, 'own')).toBe(0.65);
    expect(defaultSettings(A).utilization).toBe(0.65);
    near(daily(own({ utilization: 0.55 }), gb200).operatingProfitUsd, 12_458.71, 0.01);
    near(daily(rent({ rentBasis: 'contract', utilization: 0.55 }), gb200).operatingProfitUsd, 7386.08, 0.01);
  });
  it('the capital charge is straight-line wear plus interest, and wear alone at a 0% cost of capital', () => {
    near(daily(own({ costOfCapital: 0 }), gb200).financingUsd, 0, 1e-9);
    const d = daily(own(), gb200);
    near(d.depreciationUsd + d.financingUsd, 3064.46, 0.01);
  });
  it('owning carries fixed ops; renting does not; downtime removes 2% of sales', () => {
    expect(daily(rent(), gb200).opsUsd).toBe(0);
    near(daily(own({ opsUsdPerRackDay: 600 }), gb200).costUsd - daily(own(), gb200).costUsd, 200, 1e-9);
    const up = daily(rent({ availability: 1 }), gb200);
    near(daily(rent(), gb200).outputTokens / up.outputTokens, 0.98, 1e-12);
  });
  it('defaults carry 2% overhead and rent on a 3-year contract', () => {
    expect(defaultSettings(A).overheadPct).toBe(0.02);
    expect(defaultSettings(A).rentBasis).toBe('contract');
    expect(() => daily({ ...inputs(), overheadPct: 1 }, gb200)).toThrow();
  });
});

describe('T17 DeepSeek V4 Pro', () => {
  it('reproduces every published agentic point on benchmark-shaped traffic', () => {
    for (const [rack, curve] of [['gb200', ds200], ['gb300', ds300]] as const) {
      for (const p of curve) {
        const d = daily(forModel('dsv4pro', { rack, interactivity: p.interactivity, islOsl: 5, cacheHit: 0, utilization: 1 }), curve);
        near(d.capacityPerGpu, p.tps, 1e-9);
      }
    }
  });
  it('switching model brings its own traffic mix and prices', () => {
    const i = forModel('dsv4pro');
    expect(i.islOsl).toBe(42);
    expect(i.cacheHit).toBe(0.84);
    expect(i.priceOutUsdPerM).toBe(3.96);
    expect(i.prefillRate).toBe(7700);
  });
  it('GB200 on demand at the defaults', () => {
    const { daily: d, schedule: s } = evaluate(forModel('dsv4pro'), ds200);
    near(d.benchPerGpu, 636.2322, 1e-3);
    near(d.capacityPerGpu, 557.0628, 1e-3);
    near(d.outputTokens, 2.37724806e9, 1e3);
    near(d.revenueUsd, 27_673.45, 0.01);
    near(d.operatingProfitUsd, 9529.45, 0.01);
    near(d.operatingMargin, 0.3444, 1e-4);
    expect(s.underwaterMonth).toBe(9);
    near(breakevens(forModel('dsv4pro'), ds200).soldShareToBreakEven, 0.459, 1e-3);
  });
  it('GB300 on demand, GB200 owned and on contract at 55%', () => {
    near(daily(forModel('dsv4pro', { rack: 'gb300' }), ds300).operatingProfitUsd, 14_670.7, 0.01);
    near(daily(forModel('dsv4pro', { tenure: 'own', utilization: 0.55 }), ds200).operatingProfitUsd, 16_707.25, 0.01);
    near(daily(forModel('dsv4pro', { rentBasis: 'contract', utilization: 0.55 }), ds200).operatingProfitUsd, 11_634.62, 0.01);
  });
});
