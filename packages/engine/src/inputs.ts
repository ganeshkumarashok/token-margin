import { curveBounds, toCurve } from './curve';
import type { CurvePoint, Inputs, PricePresetId, RackId, ScenarioPresetId } from './types';

/** Shape of data/assumptions.json (only the parts the engine and UI read). */
export interface Valued {
  value: number;
  range?: [number, number];
  unit?: string;
  source: string;
  note?: string;
}
export interface RackSpec {
  label: string;
  gpus: number;
  priceUsd: Valued;
  itKw: Valued;
  tdpW: Valued;
  tcoUsdPerGpuHr: Valued;
}
export interface CurveSpec {
  label: string;
  unit: string;
  date: string;
  source: string;
  points: Array<[number, number]>;
}
export interface PriceSpec {
  label: string;
  inUsdPerM: number;
  cacheUsdPerM: number;
  outUsdPerM: number;
  source: string;
  note?: string;
}
export interface SourceSpec {
  title: string;
  url: string;
  date: string;
  kind: 'primary' | 'secondary' | 'assumption';
}
export interface Defaults {
  rack: RackId;
  racks: number;
  rackPriceMult: number;
  interactivity: number;
  achieved: number;
  utilization: number;
  pricePreset: PricePresetId;
  listShare: number;
  priceDeclinePerYear: number;
  islOsl: number;
  cacheHit: number;
  electricityUsdPerKwh: number;
  pue: number;
  idleFraction: number;
  coloUsdPerKwMonth: number;
  otherOpexPctPerYear: number;
  lifeYears: number;
  residualPct: number;
  costOfCapital: number;
  monthsToRevenue: number;
}
export interface ScenarioPreset {
  label: string;
  interactivity: number | 'curveMin';
  achieved: number;
  utilization: number;
  pricePreset: PricePresetId | 'custom';
  customPrice?: { inUsdPerM: number; cacheUsdPerM: number; outUsdPerM: number };
  priceDeclinePerYear: number;
}
export interface Assumptions {
  version: string;
  racks: Record<RackId, RackSpec>;
  model: { id: string; label: string; paramsTotalB: number; paramsActiveB: number; license: string; released: string; source: string };
  curves: Record<RackId, CurveSpec>;
  pricePresets: Record<PricePresetId, PriceSpec>;
  electricityPresets: Record<'commercial' | 'industrial', { value: number; label: string; source: string }>;
  defaults: Defaults;
  ranges: Record<string, [number, number, number]>;
  sourceBasis: Record<string, string>;
  presets: Record<ScenarioPresetId, ScenarioPreset>;
  anchors: {
    openrouterTokensPerDay: { value: number; source: string; note?: string };
    deepseekTokensPerDay: { value: number; source: string; note?: string };
    deepseekDay: {
      gpus: number; costUsdPerGpuHr: number; outputTokens: number; inputTokens: number; cacheHit: number;
      priceInUsdPerM: number; priceCacheUsdPerM: number; priceOutUsdPerM: number;
      reportedRevenueUsd: number; reportedCostUsd: number; source: string;
    };
    nvidiaClaim: { capexUsd: number; revenueUsd: number; years: number; priceOutUsdPerM: number; gpus: number; source: string };
    rentalUsdPerGpuHr: { committed: number; onDemand: number; source: string };
  };
  sources: Record<string, SourceSpec>;
}

/**
 * User-facing settings: what the knobs and URL hold. Prices are either a preset or custom.
 * `rackPriceMult` scales the selected rack's base price, so switching racks keeps the relative setting.
 */
export interface Settings extends Defaults {
  customPrice: { inUsdPerM: number; cacheUsdPerM: number; outUsdPerM: number } | null;
}

export function curveFor(a: Assumptions, rack: RackId): CurvePoint[] {
  return toCurve(a.curves[rack].points);
}

export function defaultSettings(a: Assumptions): Settings {
  return { ...a.defaults, customPrice: null };
}

export function clampInteractivity(a: Assumptions, rack: RackId, v: number): number {
  const [lo, hi] = curveBounds(curveFor(a, rack));
  return Math.min(Math.max(v, lo), hi);
}

export function sellPrices(a: Assumptions, s: Settings): { inUsdPerM: number; cacheUsdPerM: number; outUsdPerM: number } {
  if (s.customPrice) return s.customPrice;
  const p = a.pricePresets[s.pricePreset];
  return { inUsdPerM: p.inUsdPerM, cacheUsdPerM: p.cacheUsdPerM, outUsdPerM: p.outUsdPerM };
}

export function inputsFromSettings(a: Assumptions, s: Settings): Inputs {
  const rack = a.racks[s.rack];
  const sell = sellPrices(a, s);
  const list = a.pricePresets.list;
  return {
    rack: s.rack,
    racks: s.racks,
    rackPriceUsd: rack.priceUsd.value * s.rackPriceMult,
    gpusPerRack: rack.gpus,
    itKwPerRack: rack.itKw.value,
    interactivity: clampInteractivity(a, s.rack, s.interactivity),
    achieved: s.achieved,
    utilization: s.utilization,
    priceInUsdPerM: sell.inUsdPerM,
    priceCacheUsdPerM: sell.cacheUsdPerM,
    priceOutUsdPerM: sell.outUsdPerM,
    listInUsdPerM: list.inUsdPerM,
    listCacheUsdPerM: list.cacheUsdPerM,
    listOutUsdPerM: list.outUsdPerM,
    listShare: s.listShare,
    islOsl: s.islOsl,
    cacheHit: s.cacheHit,
    priceDeclinePerYear: s.priceDeclinePerYear,
    electricityUsdPerKwh: s.electricityUsdPerKwh,
    pue: s.pue,
    idleFraction: s.idleFraction,
    coloUsdPerKwMonth: s.coloUsdPerKwMonth,
    otherOpexPctPerYear: s.otherOpexPctPerYear,
    lifeYears: s.lifeYears,
    residualPct: s.residualPct,
    costOfCapital: s.costOfCapital,
    monthsToRevenue: s.monthsToRevenue,
  };
}

/** Settings overrides for a scenario preset; only the preset's keys change. */
export function applyPreset(a: Assumptions, s: Settings, id: ScenarioPresetId): Settings {
  const p = a.presets[id];
  const interactivity = p.interactivity === 'curveMin' ? curveBounds(curveFor(a, s.rack))[0] : p.interactivity;
  const custom = p.pricePreset === 'custom' ? (p.customPrice ?? null) : null;
  return {
    ...s,
    interactivity: clampInteractivity(a, s.rack, interactivity),
    achieved: p.achieved,
    utilization: p.utilization,
    pricePreset: p.pricePreset === 'custom' ? s.pricePreset : p.pricePreset,
    customPrice: custom,
    priceDeclinePerYear: p.priceDeclinePerYear,
  };
}

/** Back-compat helper named in the spec: Inputs straight from assumptions with optional overrides. */
export function inputsFromAssumptions(a: Assumptions, overrides: Partial<Settings> = {}): Inputs {
  return inputsFromSettings(a, { ...defaultSettings(a), ...overrides });
}
