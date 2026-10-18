const units: Array<[number, string]> = [
  [1e12, 'T'],
  [1e9, 'B'],
  [1e6, 'M'],
  [1e3, 'K'],
];

function scaled(v: number): string {
  const a = Math.abs(v);
  for (const [n, s] of units) {
    if (a >= n * 0.9995) return `${(v / n).toFixed(1)}${s}`;
  }
  return a >= 100 ? v.toFixed(0) : a >= 1 ? v.toFixed(1) : v.toFixed(2);
}

export function fmtTokens(v: number): string {
  return scaled(v);
}

export function fmtUsd(v: number): string {
  if (!Number.isFinite(v)) return '—';
  const sign = v < 0 ? '−' : '';
  const a = Math.abs(v);
  return `${sign}$${scaled(a)}`;
}

/** $/M token prices: up to 3 significant decimals. */
export function fmtUsdPerM(v: number | null): string {
  if (v === null || !Number.isFinite(v)) return '—';
  if (v >= 10) return `$${v.toFixed(1)}`;
  if (v >= 1) return `$${v.toFixed(2)}`;
  return `$${v.toFixed(3)}`;
}

export function fmtPct(v: number | null): string {
  if (v === null || !Number.isFinite(v)) return '—';
  const p = v * 100;
  const sign = p < 0 ? '−' : '';
  const a = Math.abs(p);
  if (a < 1 && a !== 0) return `${sign}${a.toFixed(1)}%`;
  return `${sign}${Math.round(a).toLocaleString('en-US')}%`;
}

export function fmtPayback(month: number | null, months: number): string {
  if (month === null) return `never (>${fmtYears(months / 12)})`;
  // Month 1 means cumulative cash turned positive by the end of the first month.
  if (month <= 1) return '≤1 mo';
  if (month <= 24) return `${month} mo`;
  return `${(month / 12).toFixed(1)} yr`;
}

function fmtYears(y: number): string {
  return Number.isInteger(y) ? `${y} yr` : `${y.toFixed(1)} yr`;
}

export function fmtIrr(irr: number | null): string {
  if (irr === null || !Number.isFinite(irr)) return '—';
  if (irr > 10) return '>1,000%';
  return fmtPct(irr);
}
