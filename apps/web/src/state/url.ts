import {
  clampInteractivity, defaultSettings, defaultUtilization, withModel,
  type Assumptions, type PricePresetId, type RackId, type RentBasis, type Settings, type Tenure,
} from '@token-margin/engine';

type NumKey = 'utilization' | 'islOsl' | 'cacheHit' | 'interactivity' | 'rackPriceMult' | 'achieved' | 'prefillRate' | 'overheadPct' | 'electricityUsdPerKwh' | 'opsUsdPerRackDay';

/** URL key -> settings key. Percent-like values are stored as fractions (u=0.7). */
export const NUM_KEYS: Array<[string, NumKey]> = [
  ['u', 'utilization'], ['io', 'islOsl'], ['ch', 'cacheHit'], ['i', 'interactivity'],
  ['rp', 'rackPriceMult'], ['a', 'achieved'], ['pf', 'prefillRate'], ['oh', 'overheadPct'], ['e', 'electricityUsdPerKwh'], ['ops', 'opsUsdPerRackDay'],
];
const PRICE_PRESETS: PricePresetId[] = ['floor', 'median', 'list'];

const clampTo = (v: number, [lo, hi]: [number, number, number]) => Math.min(Math.max(v, lo), hi);
const round = (v: number) => Number(v.toPrecision(6));

export function parseUrl(a: Assumptions, search: string): Settings {
  const q = new URLSearchParams(search);
  let s = defaultSettings(a);
  const m = q.get('m');
  if (m === 'dsv4pro') s = withModel(a, s, m);
  const r = q.get('r');
  if (r === 'gb200' || r === 'gb300') s.rack = r as RackId;
  const t = q.get('t');
  if (t === 'rent' || t === 'own') s.tenure = t as Tenure;
  const rb = q.get('rb');
  if (rb === 'onDemand' || rb === 'contract') s.rentBasis = rb as RentBasis;
  // Each way of paying starts at its own default utilization; a `u` in the URL overrides it below.
  s.utilization = defaultUtilization(a, s.tenure === 'own' ? 'own' : s.rentBasis);
  const pp = q.get('pp');
  if (pp && (PRICE_PRESETS as string[]).includes(pp)) s.pricePreset = pp as PricePresetId;

  for (const [qk, sk] of NUM_KEYS) {
    const raw = q.get(qk);
    if (raw === null || !Number.isFinite(Number(raw))) continue;
    const range = a.ranges[sk];
    const v = range ? clampTo(Number(raw), range) : Number(raw);
    (s as unknown as Record<string, number>)[sk] = sk === 'interactivity' ? clampInteractivity(a, s.rack, v, s.model) : v;
  }
  const rent = q.get('rent');
  if (rent !== null && Number.isFinite(Number(rent))) s.rentUsdPerGpuHr = clampTo(Number(rent), a.ranges.rentUsdPerGpuHr);
  return s;
}

/** Only what differs from the defaults goes in the URL, so a shared link stays short. */
export function toSearch(a: Assumptions, s: Settings): string {
  const d = { ...withModel(a, defaultSettings(a), s.model), utilization: defaultUtilization(a, s.tenure === 'own' ? 'own' : s.rentBasis) };
  const q = new URLSearchParams();
  if (s.model !== a.defaults.model) q.set('m', s.model);
  if (s.rack !== d.rack) q.set('r', s.rack);
  if (s.tenure !== d.tenure) q.set('t', s.tenure);
  if (s.rentBasis !== d.rentBasis) q.set('rb', s.rentBasis);
  if (s.pricePreset !== d.pricePreset) q.set('pp', s.pricePreset);
  for (const [qk, sk] of NUM_KEYS) {
    const v = s[sk];
    if (v !== null && round(v) !== round(d[sk] ?? Number.NaN)) q.set(qk, String(round(v)));
  }
  if (s.rentUsdPerGpuHr !== null) q.set('rent', String(round(s.rentUsdPerGpuHr)));
  const str = q.toString();
  return str ? `?${str}` : '';
}
