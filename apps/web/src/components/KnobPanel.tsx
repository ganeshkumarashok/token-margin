import { curveBounds, type RackId, type Settings } from '@gpu-roi/engine';
import { useState } from 'react';
import { A } from '../data';
import type { Model } from '../state/useModel';
import { Knob, Segmented } from './Knob';
import { PriceKnobs } from './PriceKnobs';

const r = (k: string) => A.ranges[k];

export function KnobPanel({ model }: { model: Model }) {
  const { settings: s, update, points } = model;
  const [advanced, setAdvanced] = useState(false);
  const rack = A.racks[s.rack];
  const [iMin, iMax] = curveBounds(points);
  const basis = A.sourceBasis;
  const num = (k: keyof Settings) => (v: number) => update({ [k]: v } as Partial<Settings>);

  return (
    <section className="knobs" aria-label="Inputs">
      <div className="knob-group">
        <h2>Inputs</h2>
        <div className="knob">
          <div className="knob-head">
            <span className="knob-label">Rack</span>
          </div>
          <Segmented<RackId>
            label="Rack"
            testId="rack-switch"
            value={s.rack}
            onChange={(v) => update({ rack: v })}
            options={[
              { id: 'gb200', label: 'GB200 NVL72' },
              { id: 'gb300', label: 'GB300 NVL72' },
            ]}
          />
        </div>
        <Knob label="Racks" value={s.racks} min={r('racks')[0]} max={r('racks')[1]} step={1} decimals={0} onChange={(v) => update({ racks: Math.round(v) })} note="72 GPUs each. Scales linearly." />
        <Knob
          label="Rack price"
          value={s.rackPriceMult}
          min={r('rackPriceMult')[0]}
          max={r('rackPriceMult')[1]}
          step={r('rackPriceMult')[2]}
          scale={rack.priceUsd.value / 1e6}
          decimals={2}
          unit="$M"
          sourceId={rack.priceUsd.source}
          note={rack.priceUsd.note}
          onChange={num('rackPriceMult')}
        />
        <Knob
          label="Serving speed"
          testId="knob-speed"
          value={s.interactivity}
          min={iMin}
          max={iMax}
          step={1}
          decimals={0}
          unit="tok/s/user"
          sourceId={basis.interactivity}
          note={`Output tokens per second each user sees. Benchmark range ${iMin}–${iMax}. Mainstream GLM-5.3 hosts serve ~70–175.`}
          onChange={num('interactivity')}
        />
        <Knob label="Achieved throughput" value={s.achieved} {...rng('achieved')} scale={100} decimals={0} unit="% of bench" sourceId={basis.achieved} note="Share of benchmark tokens/s reached on real traffic (long contexts, bursts, software gap)." onChange={num('achieved')} />
        <Knob label="Utilization" testId="knob-utilization" value={s.utilization} {...rng('utilization')} scale={100} decimals={0} unit="% sold" sourceId={basis.utilization} note="Share of capacity sold. Demand-limited, not hardware-limited." onChange={num('utilization')} />
        <PriceKnobs settings={s} update={update} />
        <Knob label="Price decline" value={s.priceDeclinePerYear} {...rng('priceDeclinePerYear')} scale={100} decimals={0} unit="%/yr" sourceId={basis.priceDeclinePerYear} note="Market token prices fall on calendar time. Half-life 1.1–1.55 yr ≈ 36–47%/yr." onChange={num('priceDeclinePerYear')} />
        <Knob label="Electricity" value={s.electricityUsdPerKwh} {...rng('electricityUsdPerKwh')} scale={100} decimals={2} unit="¢/kWh" sourceId={A.electricityPresets.commercial.source} note="EIA, July 2026" onChange={num('electricityUsdPerKwh')}>
          <div className="chips">
            <button type="button" className="chip" onClick={() => update({ electricityUsdPerKwh: A.electricityPresets.commercial.value })}>
              US commercial {(A.electricityPresets.commercial.value * 100).toFixed(1)}
            </button>
            <button type="button" className="chip" onClick={() => update({ electricityUsdPerKwh: A.electricityPresets.industrial.value })}>
              US industrial {(A.electricityPresets.industrial.value * 100).toFixed(1)}
            </button>
          </div>
        </Knob>
        <Knob label="Useful life" value={s.lifeYears} {...rng('lifeYears')} decimals={1} unit="yr" sourceId={basis.lifeYears} note="Depreciation period and model horizon." onChange={num('lifeYears')} />
      </div>

      <div className="knob-group">
        <button type="button" className="disclosure" aria-expanded={advanced} onClick={() => setAdvanced((x) => !x)}>
          {advanced ? '▾' : '▸'} Advanced
        </button>
        {advanced && (
          <div>
            <Knob label="PUE" value={s.pue} {...rng('pue')} decimals={2} sourceId={basis.pue} note="Facility power ÷ IT power." onChange={num('pue')} />
            <Knob label="Colocation" value={s.coloUsdPerKwMonth} {...rng('coloUsdPerKwMonth')} decimals={0} unit="$/kW-mo" sourceId={basis.coloUsdPerKwMonth} note="Billed on provisioned IT kW, used or not." onChange={num('coloUsdPerKwMonth')} />
            <Knob label="Other opex" value={s.otherOpexPctPerYear} {...rng('otherOpexPctPerYear')} scale={100} decimals={0} unit="% capex/yr" sourceId={basis.otherOpexPctPerYear} note="Support, spares, network, software, insurance." onChange={num('otherOpexPctPerYear')} />
            <Knob label="Input : output" value={s.islOsl} {...rng('islOsl')} decimals={0} unit="× out" sourceId={basis.islOsl} note="Input tokens per output token. Benchmark is 8K in / 1K out." onChange={num('islOsl')} />
            <Knob label="Cache hits" value={s.cacheHit} {...rng('cacheHit')} scale={100} decimals={0} unit="% of input" sourceId={basis.cacheHit} note="Billed at the cached price. Agents run >85%." onChange={num('cacheHit')} />
            <Knob label="Sold at list" value={s.listShare} {...rng('listShare')} scale={100} decimals={0} unit="%" sourceId="zai-pricing" note="Share sold through direct contracts at Z.ai list instead of the marketplace price." onChange={num('listShare')} />
            <Knob label="Cost of capital" value={s.costOfCapital} {...rng('costOfCapital')} scale={100} decimals={1} unit="%/yr" sourceId={basis.costOfCapital} note="Discount rate for NPV. Rated GPU debt ≈ SOFR + 2.25–3%." onChange={num('costOfCapital')} />
            <Knob label="Residual value" value={s.residualPct} {...rng('residualPct')} scale={100} decimals={0} unit="% of capex" sourceId={basis.residualPct} note="Resale at end of life." onChange={num('residualPct')} />
            <Knob label="Idle power" value={s.idleFraction} {...rng('idleFraction')} scale={100} decimals={0} unit="% of IT" sourceId={basis.idleFraction} note="Draw of unsold capacity." onChange={num('idleFraction')} />
            <Knob label="Months to revenue" value={s.monthsToRevenue} {...rng('monthsToRevenue')} decimals={0} unit="mo" sourceId="assumption" note="Lead time. Capex paid up front, colo accrues, prices keep falling." onChange={(v) => update({ monthsToRevenue: Math.round(v) })} />
          </div>
        )}
      </div>
    </section>
  );
}

function rng(k: string) {
  const [min, max, step] = A.ranges[k];
  return { min, max, step };
}
