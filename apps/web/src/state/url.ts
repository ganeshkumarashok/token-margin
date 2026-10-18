import { applyPreset, clampInteractivity, defaultSettings, type Assumptions, type PricePresetId, type RackId, type ScenarioPresetId, type Settings } from '@gpu-roi/engine';

type NumKey = Exclude<keyof Settings, 'rack' | 'pricePreset' | 'customPrice'>;

/** URL key -> settings key. Percent-like values are stored as fractions (u=0.6). */
export const NUM_KEYS: Array<[string, NumKey]> = [
  ['n', 'racks'], ['rp', 'rackPriceMult'], ['i', 'interactivity'], ['a', 'achieved'], ['u', 'utilization'],
  ['ls', 'listShare'], ['d', 'priceDeclinePerYear'], ['e', 'electricityUsdPerKwh'], ['L', 'lifeYears'],
  ['pue', 'pue'], ['colo', 'coloUsdPerKwMonth'], ['ox', 'otherOpexPctPerYear'], ['io', 'islOsl'],
  ['ch', 'cacheHit'], ['k', 'costOfCapital'], ['rv', 'residualPct'], ['idle', 'idleFraction'], ['m0', 'monthsToRevenue'],
];

const PRESET_KEYS: ReadonlySet<string> = new Set(['interactivity', 'achieved', 'utilization', 'pricePreset', 'customPrice', 'priceDeclinePerYear']);
const PRESETS: ScenarioPresetId[] = ['pitch', 'realistic', 'bear'];
const PRICE_PRESETS: PricePresetId[] = ['floor', 'median', 'list'];

const clampTo = (v: number, [lo, hi]: [number, number, number]) => Math.min(Math.max(v, lo), hi);
const round = (v: number) => Number(v.toPrecision(6));

function rangeFor(a: Assumptions, key: NumKey): [number, number, number] | undefined {
  return a.ranges[key];
}

export interface UrlState {
  settings: Settings;
  preset: ScenarioPresetId | null;
}

export function parseUrl(a: Assumptions, search: string): UrlState {
  const q = new URLSearchParams(search);
  let s = defaultSettings(a);
  const r = q.get('r');
  if (r === 'gb200' || r === 'gb300') s.rack = r as RackId;

  const explicitPresetKeys: Partial<Settings> = {};
  for (const [qk, sk] of NUM_KEYS) {
    const raw = q.get(qk);
    if (raw === null) continue;
    const v = Number(raw);
    if (!Number.isFinite(v)) continue;
    const range = rangeFor(a, sk);
    let val = range ? clampTo(v, range) : v;
    if (sk === 'racks') val = Math.max(1, Math.round(val));
    if (sk === 'interactivity') val = clampInteractivity(a, s.rack, val);
    if (PRESET_KEYS.has(sk)) (explicitPresetKeys as Record<string, number>)[sk] = val;
    else (s as unknown as Record<string, number>)[sk] = val;
  }

  const pp = q.get('pp');
  if (pp && (PRICE_PRESETS as string[]).includes(pp)) explicitPresetKeys.pricePreset = pp as PricePresetId;
  if (pp === 'c') {
    const num = (k: string, fallback: number) => {
      const v = Number(q.get(k));
      return q.get(k) !== null && Number.isFinite(v) && v >= 0 && v <= 100 ? v : fallback;
    };
    const base = a.pricePresets[s.pricePreset];
    explicitPresetKeys.customPrice = {
      inUsdPerM: num('pi', base.inUsdPerM),
      cacheUsdPerM: num('pc', base.cacheUsdPerM),
      outUsdPerM: num('po', base.outUsdPerM),
    };
  }

  const p = q.get('preset');
  const preset = p && (PRESETS as string[]).includes(p) ? (p as ScenarioPresetId) : null;
  if (preset) s = applyPreset(a, s, preset);
  s = { ...s, ...explicitPresetKeys };
  const presetStillExact = preset !== null && Object.keys(explicitPresetKeys).length === 0;
  return { settings: s, preset: presetStillExact ? preset : null };
}

export function toSearch(a: Assumptions, s: Settings, preset: ScenarioPresetId | null): string {
  const d = defaultSettings(a);
  const q = new URLSearchParams();
  if (preset) q.set('preset', preset);
  if (s.rack !== d.rack) q.set('r', s.rack);
  for (const [qk, sk] of NUM_KEYS) {
    if (preset && PRESET_KEYS.has(sk)) continue;
    if (round(s[sk]) !== round(d[sk])) q.set(qk, String(round(s[sk])));
  }
  if (!preset) {
    if (s.customPrice) {
      q.set('pp', 'c');
      q.set('pi', String(round(s.customPrice.inUsdPerM)));
      q.set('pc', String(round(s.customPrice.cacheUsdPerM)));
      q.set('po', String(round(s.customPrice.outUsdPerM)));
    } else if (s.pricePreset !== d.pricePreset) q.set('pp', s.pricePreset);
  }
  const str = q.toString();
  return str ? `?${str}` : '';
}
