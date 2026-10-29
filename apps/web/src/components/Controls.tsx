import { useId, type ReactNode } from 'react';
import { curveBounds, curveFor, evaluate, fmtInt, fmtPct, fmtUsdInt, fmtUsdPerM, inputsFromSettings, type PricePresetId, type Settings } from '@token-margin/engine';
import { A } from '../data';
import { breakEven, settingsForMode, type Model } from '../state/useModel';
import { FaqLink } from './Faq';

interface Mark { v: number; label: string }

interface SliderProps {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  /** where the day's profit crosses zero, if inside the range */
  zero: number | null;
  /** sign of the day's profit when it does not cross zero in the range */
  profitable: boolean;
  zeroLabel: string;
  marks?: Mark[];
  hint?: ReactNode;
  testId: string;
}

const frac = (v: number, min: number, max: number) => Math.min(1, Math.max(0, (v - min) / (max - min)));

function Slider(p: SliderProps) {
  const id = useId();
  return (
    <div className="slider" data-testid={p.testId}>
      <label htmlFor={id}>
        <span>{p.label}</span>
        <output htmlFor={id}>{p.display}</output>
      </label>
      <div className="track">
        <input id={id} type="range" min={p.min} max={p.max} step={p.step} value={p.value}
          onChange={(e) => p.onChange(Number(e.target.value))} />
        {p.marks?.map((m) => (
          <i key={m.label} className="mark" style={{ '--f': frac(m.v, p.min, p.max) } as React.CSSProperties} title={m.label} />
        ))}
        {p.zero !== null && (
          <i className="zero" style={{ '--f': frac(p.zero, p.min, p.max) } as React.CSSProperties} title={`break-even ${p.zeroLabel}`} />
        )}
      </div>
      <p className="hint">
        {p.zero !== null ? <span className="zl">break-even {p.zeroLabel}</span> : <span className="zl none">{p.profitable ? 'profitable across the range' : 'loses money across the range'}</span>}
        {p.hint ? <> · {p.hint}</> : null}
      </p>
    </div>
  );
}

function Seg<T extends string>({ value, options, onChange, label }: {
  value: T; options: Array<{ id: T; text: string; sub?: string; note?: string }>; onChange: (v: T) => void; label: string;
}) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={o.id === value} onClick={() => onChange(o.id)}>
          {o.text}{o.sub ? <span className="seg-sub">{o.sub}</span> : null}{o.note ? <span className="seg-note">{o.note}</span> : null}
        </button>
      ))}
    </div>
  );
}

type Cost = 'onDemand' | 'contract' | 'own';


export function Controls({ m }: { m: Model }) {
  const { settings: s, update } = m;
  const rack = A.racks[s.rack];
  const range = (k: string) => A.ranges[k];
  const zero = (k: keyof Settings, [lo, hi]: [number, number, number] | [number, number]) => breakEven(s, k, lo, hi);
  const cost: Cost = s.tenure === 'own' ? 'own' : s.rentBasis;
  const setCost = (c: Cost) => m.setMode(c);

  const [iLo, iHi] = curveBounds(m.points);
  const rentRange: [number, number] = [range('rentUsdPerGpuHr')[0], range('rentUsdPerGpuHr')[1]];
  const perRack = (gpuHr: number) => `${fmtUsdInt(gpuHr * rack.gpus)}/hr`;
  const p = m.prices;
  const ownS = settingsForMode(s, 'own', m.modes);
  const ownD = evaluate(inputsFromSettings(A, ownS), curveFor(A, ownS.rack, ownS.model)).daily;
  const ownPerHour = (ownD.costUsd - ownD.overheadUsd) / 24;
  const model = A.models[s.model];
  const mix = model.mix;
  const profitNow = m.result.daily.operatingProfitUsd;
  // Capacity lost per point of cache hit on this traffic: one more point of misses, everything else as set.
  const lessCache = evaluate(inputsFromSettings(A, { ...s, cacheHit: Math.max(0, s.cacheHit - 0.01) }), m.points).daily.capacityPerGpu;
  const cachePointPct = 1 - lessCache / m.result.daily.capacityPerGpu;
  // Each way of renting shows the rent it is modeled at: its list price until the slider moves it.
  const listRent = (mode: 'onDemand' | 'contract') => (mode === 'contract' ? rack.contractUsdPerGpuHr : rack.rentUsdPerGpuHr).value;
  const rentIn = (mode: 'onDemand' | 'contract') => (cost === mode ? m.rent : m.modes[mode].rentUsdPerGpuHr ?? listRent(mode));

  return (
    <section className="controls" aria-label="Assumptions">
      <div className="toggles">
        <Seg label="Rack" value={s.rack} onChange={(rk) => update({ rack: rk })}
          options={[{ id: 'gb200', text: 'GB200' }, { id: 'gb300', text: 'GB300' }]} />
        <Seg label="Cost" value={cost} onChange={setCost}
          options={[
            { id: 'onDemand', text: 'Rent on demand', sub: perRack(rentIn('onDemand')), note: 'hard to buy' },
            { id: 'contract', text: 'Rent, 3-yr contract', sub: perRack(rentIn('contract')) },
            { id: 'own', text: 'Own, all-in', sub: `${fmtUsdInt(ownPerHour)}/hr` },
          ]} />
      </div>

      {s.tenure === 'rent' ? (
        <Slider profitable={profitNow >= 0} testId="s-rent" label="Rack rent" value={m.rent} display={`${perRack(m.rent)} · $${m.rent.toFixed(2)}/GPU`}
          min={rentRange[0]} max={rentRange[1]} step={0.05} onChange={(v) => update({ rentUsdPerGpuHr: v })}
          zero={zero('rentUsdPerGpuHr', rentRange)} zeroLabel={perRack(zero('rentUsdPerGpuHr', rentRange) ?? 0)}
          marks={[
            { v: rack.contractUsdPerGpuHr.value, label: `3-yr contract ${perRack(rack.contractUsdPerGpuHr.value)}` },
            { v: rack.rentUsdPerGpuHr.value, label: `on demand ${perRack(rack.rentUsdPerGpuHr.value)}` },
          ]}
          hint={<>{s.rentBasis === 'contract'
            ? (s.rack === 'gb200' ? 'last public 3-yr contract: $261/hr (HIVE, Jun 2026); newer deals price higher' : 'last public 5-yr contract: $285/hr (HIVE, Aug 2026); newer deals price higher')
            : (s.rack === 'gb200' ? 'hard to buy on demand; the cheapest list price stands in (CoreWeave, $42/hr per 4-GPU node)' : 'hard to buy on demand; the cheapest list price stands in (Verda)')} · <FaqLink id="faq-rent">how rent is set</FaqLink></>} />
      ) : (
        <Slider profitable={profitNow >= 0} testId="s-capex" label="Rack price, all-in" value={s.rackPriceMult}
          display={`$${((rack.priceUsd.value * s.rackPriceMult) / 1e6).toFixed(2)}M · $${((m.result.daily.costUsd - m.result.daily.overheadUsd) / (rack.gpus * 24)).toFixed(2)}/GPU-hr all-in`}
          min={range('rackPriceMult')[0]} max={range('rackPriceMult')[1]} step={0.01} onChange={(v) => update({ rackPriceMult: v })}
          zero={zero('rackPriceMult', [range('rackPriceMult')[0], 3])} zeroLabel={`$${(((zero('rackPriceMult', [range('rackPriceMult')[0], 3]) ?? 0) * rack.priceUsd.value) / 1e6).toFixed(1)}M`}
          hint={<>{s.rack === 'gb200' ? 'SemiAnalysis estimate, all-in' : 'Data Gravity, small orders in Aug 2026'} · 4 years to 10% resale, 9% financing · <FaqLink id="faq-owning">how owning is costed</FaqLink></>} />
      )}

      {s.tenure === 'own' && (
        <Slider profitable={profitNow >= 0} testId="s-power" label="Power price" value={s.electricityUsdPerKwh}
          display={`${(s.electricityUsdPerKwh * 100).toFixed(1)}¢/kWh · ${fmtUsdInt(m.result.daily.electricityUsd)}/day`}
          min={range('electricityUsdPerKwh')[0]} max={range('electricityUsdPerKwh')[1]} step={0.005} onChange={(v) => update({ electricityUsdPerKwh: v })}
          zero={zero('electricityUsdPerKwh', [range('electricityUsdPerKwh')[0], 2])} zeroLabel={`${((zero('electricityUsdPerKwh', [range('electricityUsdPerKwh')[0], 2]) ?? 0) * 100).toFixed(0)}¢/kWh`}
          marks={[{ v: 0.0977, label: 'US industrial 9.8¢' }, { v: 0.1453, label: 'US commercial 14.5¢' }]}
          hint="US commercial average, Jul 2026 (EIA) · an idle GPU draws about a third of full power; cooling adds 20%" />
      )}

      {s.tenure === 'own' && (
        <Slider profitable={profitNow >= 0} testId="s-ops" label="Operations" value={s.opsUsdPerRackDay}
          display={`$${Math.round(s.opsUsdPerRackDay)}/day`}
          min={range('opsUsdPerRackDay')[0]} max={range('opsUsdPerRackDay')[1]} step={10} onChange={(v) => update({ opsUsdPerRackDay: v })}
          zero={zero('opsUsdPerRackDay', [range('opsUsdPerRackDay')[0], 30000])} zeroLabel={`$${fmtInt(zero('opsUsdPerRackDay', [range('opsUsdPerRackDay')[0], 30000]) ?? 0)}/day`}
          marks={[{ v: 220, label: 'at CoreWeave scale: $220/day' }]}
          hint={`on-call engineers, remote hands, insurance and monitoring, an estimate · support and spares add ${fmtUsdInt(m.result.daily.otherOpexUsd)}/day`} />
      )}

      <Slider profitable={profitNow >= 0} testId="s-sold" label="GPU utilization" value={s.utilization} display={fmtPct(s.utilization)}
        min={range('utilization')[0]} max={1} step={0.01} onChange={(v) => update({ utilization: v })}
        zero={zero('utilization', [0, 1])} zeroLabel={fmtPct(zero('utilization', [0, 1]))}
        hint={<>share of the rack's measured throughput you sell · <FaqLink id="faq-utilization">why 65% by default</FaqLink></>} />

      <div className="prices">
        <span className="plabel">Token price</span>
        <Seg label="Token price" value={s.pricePreset} onChange={(v: PricePresetId) => update({ pricePreset: v, customPrice: null })}
          options={[{ id: 'floor', text: 'Low' }, { id: 'median', text: 'Median' }, { id: 'list', text: 'High' }]} />
        <span className="pvals" data-testid="prices">
          {fmtUsdPerM(p.inUsdPerM)} in · {fmtUsdPerM(p.cacheUsdPerM)} cached · {fmtUsdPerM(p.outUsdPerM)} out, per million
        </span>
      </div>

      <Slider profitable={profitNow >= 0} testId="s-ratio" label="Input tokens per output token" value={s.islOsl} display={`${Math.round(s.islOsl)} : 1`}
        min={range('islOsl')[0]} max={range('islOsl')[1]} step={1} onChange={(v) => update({ islOsl: v })}
        zero={zero('islOsl', range('islOsl'))} zeroLabel={`${Math.round(zero('islOsl', range('islOsl')) ?? 0)} : 1`}
        marks={[{ v: mix.islOsl, label: `OpenRouter ${model.short}, 30 days: ${mix.islOsl} : 1` }]} hint={<><a href={mix.url}>OpenRouter's {model.short} page</a>, 30 days: {mix.islOsl} : 1{mix.range ? ` (${mix.range.islOsl[0]} to ${mix.range.islOsl[1]} by day)` : ''} · <FaqLink id="faq-ratio">how it is worked out</FaqLink></>} />

      <Slider profitable={profitNow >= 0} testId="s-cache" label="Input served from cache" value={s.cacheHit} display={fmtPct(s.cacheHit)}
        min={range('cacheHit')[0]} max={range('cacheHit')[1]} step={0.01} onChange={(v) => update({ cacheHit: v })}
        zero={zero('cacheHit', range('cacheHit'))} zeroLabel={fmtPct(zero('cacheHit', range('cacheHit')))}
        marks={[{ v: mix.cacheHit, label: `OpenRouter ${model.short}, all providers: ${fmtPct(mix.cacheHit)}` }, ...(mix.range ? [{ v: mix.range.cacheHit[0], label: `lowest day: ${fmtPct(mix.range.cacheHit[0])}` }] : [])]} hint={<><a href={mix.url}>OpenRouter</a>, all providers: {fmtPct(mix.cacheHit)}{mix.range ? ` (${fmtPct(mix.range.cacheHit[0])} to ${fmtPct(mix.range.cacheHit[1])} by day)` : ''} · each point is about {fmtPct(cachePointPct)} of capacity · <FaqLink id="faq-cache">why it matters so much</FaqLink></>} />

      <Slider profitable={profitNow >= 0} testId="s-overhead" label="Overhead" value={s.overheadPct} display={`${fmtPct(s.overheadPct)} of revenue`}
        min={range('overheadPct')[0]} max={range('overheadPct')[1]} step={range('overheadPct')[2]} onChange={(v) => update({ overheadPct: v })}
        zero={zero('overheadPct', range('overheadPct'))} zeroLabel={`${fmtPct(zero('overheadPct', range('overheadPct')))} of revenue`}
        hint={<>on-call engineering, support, billing and the API front end · <FaqLink id="faq-overhead">what is included</FaqLink></>} />

      <Slider profitable={profitNow >= 0} testId="s-speed" label="Output speed per user" value={s.interactivity} display={`${Math.round(s.interactivity)} tok/s`}
        min={iLo} max={iHi} step={0.5} onChange={(v) => update({ interactivity: v })}
        zero={zero('interactivity', [iLo, iHi])} zeroLabel={`${Math.round(zero('interactivity', [iLo, iHi]) ?? 0)} tok/s`}
        hint={<>p90 tokens/s per user; faster per user means fewer users per GPU · <FaqLink id="faq-speed">why it lowers profit</FaqLink></>} />

      {!m.isDefault && (
        <button type="button" className="reset" onClick={m.reset}>Reset to defaults</button>
      )}
    </section>
  );
}
