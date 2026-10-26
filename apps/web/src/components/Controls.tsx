import { useId, type ReactNode } from 'react';
import { curveBounds, fmtInt, fmtPct, fmtUsdInt, fmtUsdPerM, type PricePresetId, type Settings } from '@token-margin/engine';
import { A } from '../data';
import { breakEven, type Model } from '../state/useModel';

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
  value: T; options: Array<{ id: T; text: string }>; onChange: (v: T) => void; label: string;
}) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={o.id === value} onClick={() => onChange(o.id)}>
          {o.text}
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
  const profitNow = m.result.daily.operatingProfitUsd;

  return (
    <section className="controls" aria-label="Assumptions">
      <div className="toggles">
        <Seg label="Rack" value={s.rack} onChange={(rk) => update({ rack: rk })}
          options={[{ id: 'gb200', text: 'GB200' }, { id: 'gb300', text: 'GB300' }]} />
        <Seg label="Cost" value={cost} onChange={setCost}
          options={[
            { id: 'onDemand', text: `Rent on demand ${perRack(rack.rentUsdPerGpuHr.value)}` },
            { id: 'contract', text: `Rent on contract ${perRack(rack.contractUsdPerGpuHr.value)}` },
            { id: 'own', text: 'Own' },
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
          hint={s.rentBasis === 'contract'
            ? (s.rack === 'gb200' ? 'latest GB200 contract with public terms: $261/hr over 3 years (HIVE to Bell/Cohere, SEC filing, Jun 2026); new contracts have priced higher since' : 'latest GB300 contract with public terms: $285/hr over 5 years (HIVE, SEC filing, Aug 2026); new contracts have priced higher since')
            : (s.rack === 'gb200' ? 'list prices: CoreWeave $756/hr, AWS $762/hr, Oracle $1,152/hr' : 'list prices: Verda $894/hr, Oracle $1,296/hr')} />
      ) : (
        <Slider profitable={profitNow >= 0} testId="s-capex" label="Rack price, all-in" value={s.rackPriceMult}
          display={`$${((rack.priceUsd.value * s.rackPriceMult) / 1e6).toFixed(2)}M`}
          min={range('rackPriceMult')[0]} max={range('rackPriceMult')[1]} step={0.01} onChange={(v) => update({ rackPriceMult: v })}
          zero={zero('rackPriceMult', [range('rackPriceMult')[0], 3])} zeroLabel={`$${(((zero('rackPriceMult', [range('rackPriceMult')[0], 3]) ?? 0) * rack.priceUsd.value) / 1e6).toFixed(1)}M`}
          hint={`${s.rack === 'gb200' ? 'SemiAnalysis estimate including networking, storage and integration' : 'Data Gravity, from small orders transacted in Aug 2026'}. Depreciated over 4 years to 10% resale, financed at 9%`} />
      )}

      {s.tenure === 'own' && (
        <Slider profitable={profitNow >= 0} testId="s-power" label="Power price" value={s.electricityUsdPerKwh}
          display={`${(s.electricityUsdPerKwh * 100).toFixed(1)}¢/kWh · ${fmtUsdInt(m.result.daily.electricityUsd)}/day`}
          min={range('electricityUsdPerKwh')[0]} max={range('electricityUsdPerKwh')[1]} step={0.005} onChange={(v) => update({ electricityUsdPerKwh: v })}
          zero={zero('electricityUsdPerKwh', [range('electricityUsdPerKwh')[0], 2])} zeroLabel={`${((zero('electricityUsdPerKwh', [range('electricityUsdPerKwh')[0], 2]) ?? 0) * 100).toFixed(0)}¢/kWh`}
          marks={[{ v: 0.0977, label: 'US industrial 9.8¢' }, { v: 0.1453, label: 'US commercial 14.5¢' }]}
          hint="US commercial average, Jul 2026 (EIA); industrial 9.8¢. The bill grows with utilization: an unsold GPU still draws about a third of full power, and cooling adds 20%" />
      )}

      {s.tenure === 'own' && (
        <Slider profitable={profitNow >= 0} testId="s-ops" label="Operations" value={s.opsUsdPerRackDay}
          display={`$${Math.round(s.opsUsdPerRackDay)}/day`}
          min={range('opsUsdPerRackDay')[0]} max={range('opsUsdPerRackDay')[1]} step={10} onChange={(v) => update({ opsUsdPerRackDay: v })}
          zero={zero('opsUsdPerRackDay', [range('opsUsdPerRackDay')[0], 30000])} zeroLabel={`$${fmtInt(zero('opsUsdPerRackDay', [range('opsUsdPerRackDay')[0], 30000]) ?? 0)}/day`}
          marks={[{ v: 220, label: 'at CoreWeave scale: $220/day' }]}
          hint={`on-call engineers, remote hands, insurance and monitoring for a single rack, an estimate; a fleet the size of CoreWeave's spends about $220 per rack-day. Support contracts and spares add ${fmtUsdInt(m.result.daily.otherOpexUsd)}/day`} />
      )}

      <Slider profitable={profitNow >= 0} testId="s-sold" label="GPU utilization" value={s.utilization} display={fmtPct(s.utilization)}
        min={range('utilization')[0]} max={1} step={0.01} onChange={(v) => update({ utilization: v })}
        zero={zero('utilization', [0, 1])} zeroLabel={fmtPct(zero('utilization', [0, 1]))}
        hint="share of the rack's measured throughput you sell" />

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
        marks={[{ v: 63, label: 'OpenRouter GLM-5.3, 30 days: 63 : 1' }]} hint="OpenRouter GLM-5.3 traffic: 63 : 1" />

      <Slider profitable={profitNow >= 0} testId="s-cache" label="Input served from cache" value={s.cacheHit} display={fmtPct(s.cacheHit)}
        min={range('cacheHit')[0]} max={range('cacheHit')[1]} step={0.01} onChange={(v) => update({ cacheHit: v })}
        zero={zero('cacheHit', range('cacheHit'))} zeroLabel={fmtPct(zero('cacheHit', range('cacheHit')))}
        marks={[{ v: 0.9, label: 'OpenRouter GLM-5.3, all providers: 90%' }, { v: 0.8, label: 'a newer single provider: 80%' }]} hint={<>90% across all GLM-5.3 providers on OpenRouter, mostly coding agents resending their context. One rack gets that only if a conversation's later turns keep returning to it; 80% is marked for a newer provider. Cached input bills at {fmtUsdPerM(p.cacheUsdPerM)} per million instead of {fmtUsdPerM(p.inUsdPerM)}, and skips prefill</>} />

      <Slider profitable={profitNow >= 0} testId="s-overhead" label="Overhead" value={s.overheadPct} display={`${fmtPct(s.overheadPct)} of revenue`}
        min={range('overheadPct')[0]} max={range('overheadPct')[1]} step={0.01} onChange={(v) => update({ overheadPct: v })}
        zero={zero('overheadPct', range('overheadPct'))} zeroLabel={`${fmtPct(zero('overheadPct', range('overheadPct')))} of revenue`}
        hint="staff, sales, support, payment fees and the API front end; the rack price already covers CPUs, networking and storage" />

      <Slider profitable={profitNow >= 0} testId="s-speed" label="Output speed per user" value={s.interactivity} display={`${Math.round(s.interactivity)} tok/s`}
        min={iLo} max={iHi} step={0.5} onChange={(v) => update({ interactivity: v })}
        zero={zero('interactivity', [iLo, iHi])} zeroLabel={`${Math.round(zero('interactivity', [iLo, iHi]) ?? 0)} tok/s`}
        hint="tokens/s each user sees on the slowest 10% of requests (p90). Faster output per user means fewer users share each GPU, so the rack makes fewer tokens. Price stays fixed here; fast tiers on OpenRouter charge about 1.5×." />

      {!m.isDefault && (
        <button type="button" className="reset" onClick={m.reset}>Reset to the measured defaults</button>
      )}
    </section>
  );
}
