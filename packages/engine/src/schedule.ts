import type { Daily, Inputs, Schedule } from './types';

const MONTH_DAYS = 365 / 12;

export function lifeMonths(i: Inputs): number {
  return Math.max(1, Math.round(i.lifeYears * 12));
}

/** Price multiplier in month m (1-based) of revenue: prices fall continuously at the yearly rate. */
export function priceFactor(i: Inputs, m: number): number {
  return Math.pow(1 - i.priceDeclinePerYear, (m - 1) / 12);
}

function npvAt(flows: readonly number[], rMonthly: number): number {
  let s = 0;
  for (let m = 0; m < flows.length; m++) s += flows[m] / Math.pow(1 + rMonthly, m);
  return s;
}

function irrOf(flows: readonly number[]): number | null {
  let lo = -0.99;
  let hi = 10;
  let fLo = npvAt(flows, lo);
  const fHi = npvAt(flows, hi);
  if (!(fLo * fHi < 0)) return null;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    const fMid = npvAt(flows, mid);
    if (fLo * fMid <= 0) hi = mid;
    else {
      lo = mid;
      fLo = fMid;
    }
  }
  return Math.pow(1 + (lo + hi) / 2, 12) - 1;
}

export function schedule(i: Inputs, d: Daily): Schedule {
  const months = lifeMonths(i);
  // Costs that accrue whether or not the rack is serving: rent (renting) or colo + other opex (owning).
  const fixedUsd = d.rentUsd + d.coloUsd + d.otherOpexUsd;
  const renting = i.tenure === 'rent';
  const flows: number[] = [d.capexUsd > 0 ? -d.capexUsd : 0];
  let underwaterMonth: number | null = null;
  for (let m = 1; m <= months; m++) {
    if (m <= i.monthsToRevenue) {
      // Not yet serving: rack unpowered, fixed costs accrue.
      flows.push(-fixedUsd * MONTH_DAYS);
    } else {
      // Market prices fall on calendar time from month 1, whether or not the rack is serving yet.
      const pf = priceFactor(i, m);
      const flow = (d.revenueUsd * pf - d.electricityUsd - fixedUsd) * MONTH_DAYS;
      if (flow < 0 && underwaterMonth === null) underwaterMonth = m;
      // On-demand rent carries no commitment: a renter hands the rack back the month it stops paying.
      // An owner is stuck with it, so owned flows keep running negative.
      flows.push(renting && underwaterMonth !== null ? 0 : flow);
    }
  }
  const cumulative: number[] = [];
  let run = 0;
  let paybackMonth: number | null = null;
  for (let m = 0; m < flows.length; m++) {
    run += flows[m];
    cumulative.push(run);
    if (m > 0 && d.capexUsd > 0 && paybackMonth === null && run >= 0) paybackMonth = m;
  }
  const residualUsd = d.capexUsd * i.residualPct;
  const terminal = flows.slice();
  terminal[months] += residualUsd;
  const rMonthly = Math.pow(1 + i.costOfCapital, 1 / 12) - 1;
  return {
    months,
    flows,
    cumulative,
    paybackMonth,
    underwaterMonth,
    npvUsd: npvAt(terminal, rMonthly),
    irr: irrOf(terminal),
    residualUsd,
  };
}
