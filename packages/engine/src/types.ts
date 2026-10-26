export type RackId = 'gb200' | 'gb300';
export type PricePresetId = 'floor' | 'median' | 'list';
export type ScenarioPresetId = 'pitch' | 'realistic' | 'bear';
/** what a renter pays: the published on-demand list price, or a multi-year multi-rack contract */
export type RentBasis = 'onDemand' | 'contract';
/** Who pays for the rack. A renter pays $/GPU-hr and nothing else; an owner pays capex, power, colo and opex. */
export type Tenure = 'rent' | 'own';

/** One published benchmark point: serving speed (tok/s per user) -> output tok/s per *decode* GPU. */
export interface CurvePoint {
  interactivity: number;
  tps: number;
}

export interface Inputs {
  tenure: Tenure;
  rack: RackId;
  racks: number;
  rackPriceUsd: number;
  /** $/GPU-hr paid by a renter; ignored when owning */
  rentUsdPerGpuHr: number;
  gpusPerRack: number;
  itKwPerRack: number;
  /** tok/s per user; clamped to curve bounds */
  interactivity: number;
  /** 0..1 share of benchmark throughput achieved on real traffic */
  achieved: number;
  /** 0..1 utilization: share of measured capacity sold */
  utilization: number;
  /** uncached input tokens prefilled per second per prefill GPU */
  prefillRate: number;
  /** uncached input tokens per output token in the benchmark the curve was measured on */
  refUncachedPerOut: number;
  priceInUsdPerM: number;
  priceCacheUsdPerM: number;
  priceOutUsdPerM: number;
  listInUsdPerM: number;
  listCacheUsdPerM: number;
  listOutUsdPerM: number;
  /** 0..1 share of revenue spent on overhead beyond the rack: staff, sales, support, payment fees, API front end */
  overheadPct: number;
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
  /** 0 when renting */
  capexUsd: number;
  gpus: number;
  /** benchmark output tok/s per GPU, prefill GPUs included, at this serving speed (InferenceX) */
  benchPerGpu: number;
  /** output tok/s per GPU on this traffic's prefill load, before the achieved haircut */
  capacityPerGpu: number;
  /** output tok/s per GPU actually produced: capacity x achieved */
  tpsPerGpu: number;
  outputTokens: number;
  inputTokens: number;
  uncachedInputTokens: number;
  cachedInputTokens: number;
  revenueUsd: number;
  outputRevenueUsd: number;
  inputRevenueUsd: number;
  /** 0 when owning */
  rentUsd: number;
  /** overheadPct x revenue */
  overheadUsd: number;
  /** 0 when renting (the landlord pays) */
  electricityUsd: number;
  coloUsd: number;
  otherOpexUsd: number;
  /** rent when renting; electricity + colo + other opex when owning */
  cashCostUsd: number;
  cashProfitUsd: number;
  /** 0 when renting */
  depreciationUsd: number;
  /** cash cost + depreciation: the whole day's cost under either tenure */
  costUsd: number;
  /** revenue - costUsd: the day's profit under either tenure */
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
  /** index 0 = month 0 (capex; 0 when renting); length months + 1; residual not included */
  flows: number[];
  cumulative: number[];
  /** first month cumulative cash >= 0; null when it never happens or when there is no capex to pay back */
  paybackMonth: number | null;
  /** first serving month whose cash flow is negative (prices have fallen below cost); null if none */
  underwaterMonth: number | null;
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
  /** Share of capacity that must be sold for the day to break even, everything else as set; null if even 100% loses money. */
  soldShareToBreakEven: number | null;
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
