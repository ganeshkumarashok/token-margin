export type RackId = 'gb200' | 'gb300';
export type PricePresetId = 'floor' | 'median' | 'list';
export type ScenarioPresetId = 'pitch' | 'realistic' | 'bear';

/** One published benchmark point: serving speed (tok/s per user) -> output tok/s per GPU. */
export interface CurvePoint {
  interactivity: number;
  tps: number;
}

export interface Inputs {
  rack: RackId;
  racks: number;
  rackPriceUsd: number;
  gpusPerRack: number;
  itKwPerRack: number;
  /** tok/s per user; clamped to curve bounds */
  interactivity: number;
  /** 0..1 share of benchmark throughput achieved on real traffic */
  achieved: number;
  /** 0..1 share of capacity sold */
  utilization: number;
  priceInUsdPerM: number;
  priceCacheUsdPerM: number;
  priceOutUsdPerM: number;
  listInUsdPerM: number;
  listCacheUsdPerM: number;
  listOutUsdPerM: number;
  /** 0..1 share of tokens sold at list */
  listShare: number;
  /** input tokens processed per output token */
  islOsl: number;
  /** 0..1 share of input tokens that are cache reads */
  cacheHit: number;
  /** 0..0.99 */
  priceDeclinePerYear: number;
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

export interface Daily {
  capexUsd: number;
  gpus: number;
  tpsPerGpu: number;
  outputTokens: number;
  inputTokens: number;
  uncachedInputTokens: number;
  cachedInputTokens: number;
  revenueUsd: number;
  outputRevenueUsd: number;
  inputRevenueUsd: number;
  electricityUsd: number;
  coloUsd: number;
  otherOpexUsd: number;
  cashCostUsd: number;
  cashProfitUsd: number;
  depreciationUsd: number;
  operatingProfitUsd: number;
  cashMargin: number | null;
  operatingMargin: number | null;
  cashCostPerMOut: number | null;
  fullCostPerMOut: number | null;
  revenuePerGpuHr: number;
  facilityKw: number;
}

export interface Schedule {
  months: number;
  /** index 0 = month 0 (capex); length months + 1; residual not included */
  flows: number[];
  cumulative: number[];
  paybackMonth: number | null;
  npvUsd: number;
  irr: number | null;
  residualUsd: number;
}

export interface Breakevens {
  /**
   * Share of current token prices (all of input, cached, output scaled together) at which operating profit = 0.
   * 0.13 means prices can fall 87% before the rack loses money on an accounting basis. null when no revenue.
   */
  priceLevel: number | null;
  /** Output price at that level (input prices scaled the same way); null when no revenue. */
  outPriceUsdPerM: number | null;
  /** Largest yearly price decline with NPV >= 0 at the cost of capital; null if NPV < 0 even with no decline. */
  priceDeclineForZeroNpv: number | null;
  utilizationForPaybackAtLife: number | null;
  priceDeclineForPaybackAtLife: number | null;
}

export interface DemandShare {
  tokensPerDay: number;
  shareOfOpenRouter: number;
  shareOfDeepSeek2025: number;
}

export interface Result {
  inputs: Inputs;
  daily: Daily;
  schedule: Schedule;
}
