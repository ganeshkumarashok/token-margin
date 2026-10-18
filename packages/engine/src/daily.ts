import { throughputAt } from './curve';
import type { CurvePoint, Daily, Inputs } from './types';

const DAY_S = 86400;

function check(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`invalid input: ${msg}`);
}

const unit = (v: number) => Number.isFinite(v) && v >= 0 && v <= 1;
const nonneg = (v: number) => Number.isFinite(v) && v >= 0;

export function validateInputs(i: Inputs): void {
  for (const [k, v] of Object.entries(i)) {
    if (typeof v === 'number') check(Number.isFinite(v), `${k} is not a finite number`);
  }
  check(i.racks > 0 && Number.isInteger(i.racks), 'racks must be a positive integer');
  check(i.gpusPerRack > 0, 'gpusPerRack must be positive');
  check(nonneg(i.rackPriceUsd), 'rackPriceUsd must be >= 0');
  check(nonneg(i.itKwPerRack), 'itKwPerRack must be >= 0');
  check(i.interactivity > 0, 'interactivity must be positive');
  check(unit(i.achieved), 'achieved must be in [0, 1]');
  check(unit(i.utilization), 'utilization must be in [0, 1]');
  check(unit(i.cacheHit), 'cacheHit must be in [0, 1]');
  check(unit(i.listShare), 'listShare must be in [0, 1]');
  check(unit(i.idleFraction), 'idleFraction must be in [0, 1]');
  check(unit(i.residualPct), 'residualPct must be in [0, 1]');
  check(i.priceDeclinePerYear >= 0 && i.priceDeclinePerYear < 0.99, 'priceDeclinePerYear must be in [0, 0.99)');
  check(i.lifeYears > 0, 'lifeYears must be > 0');
  check(i.pue >= 1, 'pue must be >= 1');
  check(nonneg(i.islOsl), 'islOsl must be >= 0');
  check(nonneg(i.monthsToRevenue), 'monthsToRevenue must be >= 0');
  check(i.costOfCapital > -1, 'costOfCapital must be > -100%');
  for (const k of [
    'priceInUsdPerM', 'priceCacheUsdPerM', 'priceOutUsdPerM',
    'listInUsdPerM', 'listCacheUsdPerM', 'listOutUsdPerM',
    'electricityUsdPerKwh', 'coloUsdPerKwMonth', 'otherOpexPctPerYear',
  ] as const) {
    check(nonneg(i[k]), `${k} must be >= 0`);
  }
}

export function daily(i: Inputs, points: readonly CurvePoint[]): Daily {
  validateInputs(i);
  const gpus = i.racks * i.gpusPerRack;
  const capexUsd = i.racks * i.rackPriceUsd;
  const tpsPerGpu = throughputAt(points, i.interactivity) * i.achieved;

  const outputTokens = tpsPerGpu * gpus * i.utilization * DAY_S;
  const inputTokens = outputTokens * i.islOsl;
  const cachedInputTokens = inputTokens * i.cacheHit;
  const uncachedInputTokens = inputTokens - cachedInputTokens;

  const rev = (pIn: number, pCache: number, pOut: number) =>
    (outputTokens * pOut + uncachedInputTokens * pIn + cachedInputTokens * pCache) / 1e6;
  const revenueUsd =
    (1 - i.listShare) * rev(i.priceInUsdPerM, i.priceCacheUsdPerM, i.priceOutUsdPerM) +
    i.listShare * rev(i.listInUsdPerM, i.listCacheUsdPerM, i.listOutUsdPerM);
  const outputRevenueUsd =
    ((1 - i.listShare) * outputTokens * i.priceOutUsdPerM + i.listShare * outputTokens * i.listOutUsdPerM) / 1e6;
  const inputRevenueUsd = revenueUsd - outputRevenueUsd;

  // Power: sold capacity runs at full IT load, unsold capacity idles. `achieved` changes tokens, not power.
  const facilityKw = i.itKwPerRack * i.racks * (i.utilization + (1 - i.utilization) * i.idleFraction) * i.pue;
  const electricityUsd = facilityKw * 24 * i.electricityUsdPerKwh;
  // Colocation is billed on provisioned IT kW regardless of load.
  const coloUsd = (i.coloUsdPerKwMonth * i.itKwPerRack * i.racks * 12) / 365;
  const otherOpexUsd = (capexUsd * i.otherOpexPctPerYear) / 365;
  const cashCostUsd = electricityUsd + coloUsd + otherOpexUsd;
  const cashProfitUsd = revenueUsd - cashCostUsd;
  const depreciationUsd = (capexUsd * (1 - i.residualPct)) / (i.lifeYears * 365);
  const operatingProfitUsd = cashProfitUsd - depreciationUsd;

  const mOut = outputTokens / 1e6;
  return {
    capexUsd,
    gpus,
    tpsPerGpu,
    outputTokens,
    inputTokens,
    uncachedInputTokens,
    cachedInputTokens,
    revenueUsd,
    outputRevenueUsd,
    inputRevenueUsd,
    electricityUsd,
    coloUsd,
    otherOpexUsd,
    cashCostUsd,
    cashProfitUsd,
    depreciationUsd,
    operatingProfitUsd,
    cashMargin: revenueUsd > 0 ? cashProfitUsd / revenueUsd : null,
    operatingMargin: revenueUsd > 0 ? operatingProfitUsd / revenueUsd : null,
    cashCostPerMOut: mOut > 0 ? cashCostUsd / mOut : null,
    fullCostPerMOut: mOut > 0 ? (cashCostUsd + depreciationUsd) / mOut : null,
    revenuePerGpuHr: revenueUsd / (gpus * 24),
    facilityKw,
  };
}
