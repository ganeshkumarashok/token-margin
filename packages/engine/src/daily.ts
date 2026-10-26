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
  check(i.tenure === 'rent' || i.tenure === 'own', 'tenure must be rent or own');
  check(i.racks > 0 && Number.isInteger(i.racks), 'racks must be a positive integer');
  check(i.gpusPerRack > 0, 'gpusPerRack must be positive');
  check(nonneg(i.rackPriceUsd), 'rackPriceUsd must be >= 0');
  check(nonneg(i.rentUsdPerGpuHr), 'rentUsdPerGpuHr must be >= 0');
  check(nonneg(i.itKwPerRack), 'itKwPerRack must be >= 0');
  check(i.interactivity > 0, 'interactivity must be positive');
  check(i.prefillRate > 0, 'prefillRate must be positive');
  check(nonneg(i.refUncachedPerOut), 'refUncachedPerOut must be >= 0');
  check(unit(i.achieved), 'achieved must be in [0, 1]');
  check(unit(i.utilization), 'utilization must be in [0, 1]');
  check(unit(i.cacheHit), 'cacheHit must be in [0, 1]');
  check(unit(i.listShare), 'listShare must be in [0, 1]');
  check(i.availability > 0 && i.availability <= 1, 'availability must be in (0, 1]');
  check(nonneg(i.opsUsdPerRackDay), 'opsUsdPerRackDay must be >= 0');
  check(i.overheadPct >= 0 && i.overheadPct < 1, 'overheadPct must be in [0, 1)');
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
  const renting = i.tenure === 'rent';
  const gpus = i.racks * i.gpusPerRack;
  const capexUsd = renting ? 0 : i.racks * i.rackPriceUsd;

  // InferenceX AgentX publishes output tok/s over all GPUs, prefill included, on traffic that prefills
  // `refUncachedPerOut` uncached input tokens per output token. Traffic that prefills more or fewer
  // moves the GPU-seconds per output token by the difference at the prefill rate.
  const benchPerGpu = throughputAt(points, i.interactivity);
  const extraPrefillSec = (i.islOsl * (1 - i.cacheHit) - i.refUncachedPerOut) / i.prefillRate;
  const secPerOut = 1 / benchPerGpu + extraPrefillSec;
  check(secPerOut > 0, 'refUncachedPerOut / prefillRate exceeds the benchmark time per output token');
  const capacityPerGpu = 1 / secPerOut;
  // Failures take the rack out of service for a share of the day; that capacity cannot be sold.
  const tpsPerGpu = capacityPerGpu * i.achieved * i.availability;

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
  // A renter pays $/GPU-hr for every GPU, used or not; power, colo and depreciation are the landlord's.
  const rentUsd = renting ? i.rentUsdPerGpuHr * gpus * 24 : 0;
  const electricityUsd = renting ? 0 : facilityKw * 24 * i.electricityUsdPerKwh;
  // Colocation is billed on provisioned IT kW regardless of load.
  const coloUsd = renting ? 0 : (i.coloUsdPerKwMonth * i.itKwPerRack * i.racks * 12) / 365;
  const otherOpexUsd = renting ? 0 : (capexUsd * i.otherOpexPctPerYear) / 365;
  const opsUsd = renting ? 0 : i.opsUsdPerRackDay * i.racks;
  const overheadUsd = revenueUsd * i.overheadPct;
  const cashCostUsd = rentUsd + electricityUsd + coloUsd + otherOpexUsd + opsUsd + overheadUsd;
  const cashProfitUsd = revenueUsd - cashCostUsd;
  const depreciationUsd = renting ? 0 : (capexUsd * (1 - i.residualPct)) / (i.lifeYears * 365);
  const costUsd = cashCostUsd + depreciationUsd;
  const operatingProfitUsd = revenueUsd - costUsd;

  const mOut = outputTokens / 1e6;
  return {
    capexUsd,
    gpus,
    benchPerGpu,
    capacityPerGpu,
    tpsPerGpu,
    outputTokens,
    inputTokens,
    uncachedInputTokens,
    cachedInputTokens,
    revenueUsd,
    outputRevenueUsd,
    inputRevenueUsd,
    rentUsd,
    overheadUsd,
    electricityUsd,
    coloUsd,
    otherOpexUsd,
    opsUsd,
    cashCostUsd,
    cashProfitUsd,
    depreciationUsd,
    costUsd,
    operatingProfitUsd,
    cashMargin: revenueUsd > 0 ? cashProfitUsd / revenueUsd : null,
    operatingMargin: revenueUsd > 0 ? operatingProfitUsd / revenueUsd : null,
    cashCostPerMOut: mOut > 0 ? cashCostUsd / mOut : null,
    fullCostPerMOut: mOut > 0 ? costUsd / mOut : null,
    revenuePerGpuHr: revenueUsd / (gpus * 24),
    facilityKw,
  };
}
