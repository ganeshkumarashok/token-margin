import { describe, expect, it } from 'vitest';
import {
  applyPreset, breakevens, costPerMillion, daily, demandShare, evaluate, impliedTps, schedule, sensitivity, throughputAt,
} from '../src';
import { A, gb200, gb300, inputs, presetInputs, settings } from './helpers';

const anchors = { openrouterTokensPerDay: A.anchors.openrouterTokensPerDay.value, deepseekTokensPerDay: A.anchors.deepseekTokensPerDay.value };
const near = (v: number | null, want: number, tol: number) => {
  expect(v).not.toBeNull();
  expect(Math.abs((v as number) - want)).toBeLessThanOrEqual(tol);
};

describe('T1 throughputAt', () => {
  it('hits published points, interpolates log-linearly, clamps', () => {
    near(throughputAt(gb200, 58), 9598, 1e-6);
    near(throughputAt(gb200, 104), 3619, 1e-6);
    near(throughputAt(gb200, 100), 4134.45, 0.1);
    near(throughputAt(gb200, 30), 9598, 1e-6);
    near(throughputAt(gb200, 200), 630, 1e-6);
    near(throughputAt(gb300, 100), 4812.41, 0.1);
  });
});

describe('T2 costPerMillion reproduces InferenceX', () => {
  it('GB200 $0.054 and GB300 $0.063', () => {
    near(costPerMillion(1.86, 9598), 0.05383, 1e-4);
    near(costPerMillion(2.31, 10192), 0.06296, 1e-4);
  });
});

describe('T3 pitch at the 58 tok/s benchmark point, list price', () => {
  const i = inputs({ interactivity: 58, achieved: 1, utilization: 1, pricePreset: 'list' });
  const d = daily(i, gb200);
  it('daily figures', () => {
    expect(d.outputTokens).toBeCloseTo(59_707_238_400, 0);
    near(d.revenueUsd, 659_167.9, 1);
    near(d.electricityUsd, 502.16, 0.1);
    near(d.coloUsd, 789.04, 0.1);
    near(d.otherOpexUsd, 534.25, 0.1);
    near(d.depreciationUsd, 2404.11, 0.1);
    near(d.fullCostPerMOut, 0.0708, 0.001);
    near(d.revenuePerGpuHr, 381.46, 0.1);
  });
  it('pays back in month 1 with no price decline', () => {
    expect(schedule({ ...i, priceDeclinePerYear: 0 }, d).paybackMonth).toBe(1);
  });
});

describe('T4 realistic defaults', () => {
  it('GB200', () => {
    const { daily: d, schedule: s } = evaluate(inputs(), gb200);
    near(d.tpsPerGpu, 2067.22, 0.1);
    near(d.outputTokens, 7.7159e9, 1e6);
    near(d.revenueUsd, 40_508.3, 1);
    near(d.inputRevenueUsd, 21_218.7, 1);
    near(d.electricityUsd, 371.6, 0.1);
    near(d.cashMargin, 0.9582, 0.001);
    near(d.fullCostPerMOut, 0.5312, 0.001);
    near(d.revenuePerGpuHr, 23.44, 0.01);
    expect(s.paybackMonth).toBe(4);
    near(s.npvUsd, 13_228_607, 1000);
    near(s.irr, 12.67, 0.05);
  });
  it('T4b GB300', () => {
    const { daily: d, schedule: s } = evaluate(inputs({ rack: 'gb300' }), gb300);
    near(d.tpsPerGpu, 2406.21, 0.1);
    near(d.revenueUsd, 47_150.8, 1);
    expect(s.paybackMonth).toBe(4);
    near(s.npvUsd, 14_986_718, 1000);
  });
});

describe('T5 bear preset', () => {
  it('never pays back', () => {
    const { daily: d, schedule: s } = evaluate(presetInputs('bear'), gb200);
    near(d.revenueUsd, 6751.39, 0.1);
    near(d.cashMargin, 0.7586, 0.001);
    near(d.operatingMargin, 0.4025, 0.001);
    expect(s.paybackMonth).toBeNull();
    near(s.npvUsd, -3_662_723, 1000);
    near(s.irr, -0.7647, 0.005);
  });
});

describe('T6 break-even output price', () => {
  it('price level × output price equals full cost per M output when there is no input revenue', () => {
    const i = inputs({ interactivity: 58, achieved: 1, utilization: 1, pricePreset: 'list', islOsl: 0 });
    near(breakevens(i, gb200).outPriceUsdPerM, 0.07084, 1e-4);
    near(daily(i, gb200).fullCostPerMOut, 0.07084, 1e-4);
  });
  it('break-even utilization and decline bracket the defaults sensibly', () => {
    const b = breakevens(inputs(), gb200);
    expect(b.utilizationForPaybackAtLife).not.toBeNull();
    expect(b.utilizationForPaybackAtLife!).toBeLessThan(0.6);
    expect(b.priceDeclineForPaybackAtLife).not.toBeNull();
    expect(b.priceDeclineForPaybackAtLife!).toBeGreaterThan(0.5);
    // at the break-even utilization, payback is within life; slightly below, it is not
    const at = evaluate(inputs({ utilization: b.utilizationForPaybackAtLife! }), gb200).schedule;
    expect(at.paybackMonth).not.toBeNull();
    const below = evaluate(inputs({ utilization: b.utilizationForPaybackAtLife! * 0.98 }), gb200).schedule;
    expect(below.paybackMonth).toBeNull();
  });
  it('price level is full cost over revenue; realistic prices can fall ~90%', () => {
    const i = inputs();
    const d = daily(i, gb200);
    const b = breakevens(i, gb200);
    near(b.priceLevel, (d.cashCostUsd + d.depreciationUsd) / d.revenueUsd, 1e-12);
    near(b.priceLevel, 0.1012, 0.001);
    // scaling every price by the level gives zero operating profit
    const lvl = b.priceLevel!;
    const z = daily({ ...i, priceInUsdPerM: i.priceInUsdPerM * lvl, priceCacheUsdPerM: i.priceCacheUsdPerM * lvl, priceOutUsdPerM: i.priceOutUsdPerM * lvl }, gb200);
    near(z.operatingProfitUsd, 0, 1e-6);
  });
  it('NPV break-even decline: NPV ~0 there', () => {
    const i = inputs({ achieved: 0.25 });
    const b = breakevens(i, gb200);
    expect(b.priceDeclineForZeroNpv).not.toBeNull();
    const s = evaluate({ ...i, priceDeclinePerYear: b.priceDeclineForZeroNpv! }, gb200).schedule;
    expect(Math.abs(s.npvUsd)).toBeLessThan(5000);
    // bear is NPV-positive with flat prices, so its threshold exists and sits below its own 70%/yr decline
    const bear = breakevens(presetInputs('bear'), gb200).priceDeclineForZeroNpv;
    expect(bear).not.toBeNull();
    expect(bear!).toBeLessThan(0.7);
    // halve achieved throughput again and drop utilization: NPV < 0 even with flat prices
    expect(breakevens(presetInputs('bear', {}), gb200).priceDeclineForZeroNpv).not.toBeNull();
    expect(breakevens({ ...presetInputs('bear'), utilization: 0.1, achieved: 0.1 }, gb200).priceDeclineForZeroNpv).toBeNull();
  });
  it('bear case has no utilization that pays back', () => {
    expect(breakevens(presetInputs('bear'), gb200).utilizationForPaybackAtLife).toBeNull();
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
  it('realistic needs ~0.8% of OpenRouter', () => {
    const ds = demandShare(daily(inputs(), gb200), anchors);
    near(ds.tokensPerDay, 69.44e9, 1e7);
    near(ds.shareOfOpenRouter, 0.00798, 1e-4);
    near(ds.shareOfDeepSeek2025, 0.0895, 1e-3);
  });
});

describe('T10 lead time', () => {
  it('six months to first revenue', () => {
    const s = evaluate(inputs({ monthsToRevenue: 6 }), gb200).schedule;
    expect(s.paybackMonth).toBe(12);
    near(s.npvUsd, 6_984_581, 1000);
  });
});

describe('T11 zero utilization', () => {
  it('no revenue, idle power only', () => {
    const d = daily(inputs({ utilization: 0 }), gb200);
    expect(d.revenueUsd).toBe(0);
    expect(d.cashMargin).toBeNull();
    expect(d.operatingMargin).toBeNull();
    expect(d.cashCostPerMOut).toBeNull();
    near(d.electricityUsd, 175.75, 0.1);
    expect(breakevens(inputs({ utilization: 0 }), gb200).outPriceUsdPerM).toBeNull();
  });
});

describe('T12 properties', () => {
  it('flat flows without decline', () => {
    const s = evaluate(inputs({ priceDeclinePerYear: 0, monthsToRevenue: 2 }), gb200).schedule;
    const after = s.flows.slice(3);
    for (const f of after) expect(f).toBeCloseTo(after[0], 6);
  });
  it('cumulative equals sum of flows', () => {
    const s = evaluate(inputs(), gb200).schedule;
    const sum = s.flows.reduce((x, y) => x + y, 0);
    expect(s.cumulative[s.months]).toBeCloseTo(sum, 4);
  });
  it('more utilization never delays payback', () => {
    let prev = Infinity;
    for (let u = 0.1; u <= 1.0001; u += 0.05) {
      const p = evaluate(inputs({ utilization: Math.min(u, 1) }), gb200).schedule.paybackMonth ?? Infinity;
      expect(p).toBeLessThanOrEqual(prev);
      prev = p;
    }
  });
  it('throughput is non-increasing in serving speed', () => {
    for (const c of [gb200, gb300]) {
      let prev = Infinity;
      for (let x = 50; x <= 150; x += 1) {
        const t = throughputAt(c, x);
        expect(t).toBeLessThanOrEqual(prev + 1e-9);
        prev = t;
      }
    }
  });
  it('sensitivity rows sorted by swing; prices and utilization outrank electricity', () => {
    const rows = sensitivity(inputs(), gb200);
    for (let k = 1; k < rows.length; k++) expect(rows[k].swing).toBeLessThanOrEqual(rows[k - 1].swing);
    const idx = (key: string) => rows.findIndex((r) => r.key === key);
    expect(idx('prices')).toBeLessThan(idx('electricity'));
    expect(idx('utilization')).toBeLessThan(idx('electricity'));
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
    expect(() => throughputAt([{ interactivity: 60, tps: 1 }, { interactivity: 50, tps: 2 }], 55)).toThrow();
  });
});

describe('T14 presets', () => {
  it('pitch uses the curve minimum for each rack', () => {
    expect(applyPreset(A, settings({ rack: 'gb200' }), 'pitch').interactivity).toBe(58);
    expect(applyPreset(A, settings({ rack: 'gb300' }), 'pitch').interactivity).toBe(67);
  });
  it('realistic preset equals defaults', () => {
    const r = applyPreset(A, settings(), 'realistic');
    expect(r).toEqual(settings());
  });
});
