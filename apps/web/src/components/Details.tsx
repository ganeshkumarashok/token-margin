import { fmtInt, fmtPct, fmtTokens, fmtUsdInt, fmtUsdPerM, type ModelId } from '@token-margin/engine';
import { A } from '../data';
import type { Model } from '../state/useModel';
import { Cite } from './Cite';
import { Faq } from './Faq';

import { REPO } from '../links';

export const DISCLAIMER =
  'Personal side project, built from public data. It does not necessarily represent the views of my employer or of any company named here, and none of them sponsored it. The author may hold investments in companies mentioned here. Not financial, investment, tax, or purchasing advice. Estimates from public sources under stated assumptions; they can be wrong by large factors.';

/** Sources shown on the page for a model, in footnote order. */
function sourcesFor(model: ModelId): string[] {
  const m = A.models[model];
  return [
    m.curves.gb200.source, m.mix.source, m.pricePresets.median.source, ...(model === 'glm53' ? ['zai-pricing'] : []),
    'coreweave-pricing', 'verda-pricing', 'contracts-2026', 'semianalysis-gb200-capex', 'datagravity-nvl72-cost',
    'eia-5-6-a', 'cbre-colo', 'owning-opex-2026', 'inferencex-tco-availability', 'utilization-pattern-2026', ...(model === 'glm53' ? ['hf-glm-5.3'] : []),
  ].filter((id, k, all) => A.sources[id] && all.indexOf(id) === k);
}

type FnMark = (props: { id: string | string[] }) => JSX.Element | null;

/** Footnote marks numbered by a source list; several sources share one superscript, comma-separated. */
function footnotes(sources: string[]): FnMark {
  return function Fn({ id }) {
    const ns = (Array.isArray(id) ? id : [id]).map((x) => sources.indexOf(x) + 1).filter((n) => n > 0);
    if (!ns.length) return null;
    // The source list is folded; open it before the browser jumps to the entry.
    const open = () => { const el = document.getElementById('sources'); if (el instanceof HTMLDetailsElement) el.open = true; };
    return <sup>{ns.map((n, k) => <span key={n}>{k > 0 ? ',' : ''}<a href={`#src-${n}`} onClick={open}>{n}</a></span>)}</sup>;
  };
}

type Row = { label: string; note?: string; value: string; fn?: string | string[]; total?: boolean };

function Block({ title, unit, rows, after, Fn }: { title: string; unit?: string; rows: Row[]; after?: React.ReactNode; Fn: FnMark }) {
  return (
    <tbody>
      <tr className="rh"><th colSpan={2}>{title}</th><th className="unit">{unit}</th></tr>
      {rows.map((r) => (
        <tr key={r.label} className={r.total ? 'total' : undefined}>
          <td className="l">{r.label}{r.fn ? <Fn id={r.fn} /> : null}</td>
          <td className="n">{r.note}</td>
          <td className="v">{r.value}</td>
        </tr>
      ))}
      {after ? <tr className="after"><td colSpan={3}>{after}</td></tr> : null}
    </tbody>
  );
}

export function Details({ m }: { m: Model }) {
  const { settings: s, result, inputs: i } = m;
  const d = result.daily;
  const rack = A.racks[s.rack];
  const owning = s.tenure === 'own';
  const price = (v: number) => `${fmtUsdPerM(v)}/M`;
  // Enough digits that each line multiplies out to the dollar figure shown.
  const exact = (v: number) => (v >= 1e9 ? `${(v / 1e9).toPrecision(5)}B` : `${(v / 1e6).toPrecision(5)}M`);
  const uncachedRev = (d.uncachedInputTokens * i.priceInUsdPerM) / 1e6;
  const cachedRev = d.inputRevenueUsd - uncachedRev;
  const model = A.models[s.model];
  const sources = sourcesFor(s.model);
  const Fn = footnotes(sources);
  const share = (d.outputTokens + d.inputTokens) / model.openrouterTokensPerDay.value;
  const loadPct = fmtPct(i.utilization + (1 - i.utilization) * i.idleFraction);

  const cost: Row[] = owning
    ? [
        { label: 'Depreciation', note: `$${(d.capexUsd / 1e6).toFixed(1)}M rack to ${fmtPct(i.residualPct)} resale over ${i.lifeYears} years`, value: fmtUsdInt(d.depreciationUsd), fn: rack.priceUsd.source },
        { label: 'Financing', note: `interest at ${fmtPct(i.costOfCapital)} a year, averaged over the ${i.lifeYears} years`, value: fmtUsdInt(d.financingUsd) },
        { label: 'Support and spares', note: `${fmtPct(i.otherOpexPctPerYear)} of the rack price a year`, value: fmtUsdInt(d.otherOpexUsd), fn: 'owning-opex-2026' },
        { label: 'Operations', note: 'on-call, remote hands, insurance', value: fmtUsdInt(d.opsUsd), fn: 'owning-opex-2026' },
        { label: 'Space', note: `${i.itKwPerRack} kW × $${i.coloUsdPerKwMonth}/kW-month`, value: fmtUsdInt(d.coloUsd), fn: 'cbre-colo' },
        { label: 'Power', note: `${loadPct} of ${i.itKwPerRack} kW × ${i.pue} cooling × ${(i.electricityUsdPerKwh * 100).toFixed(1)}¢/kWh`, value: fmtUsdInt(d.electricityUsd), fn: 'eia-5-6-a' },
      ]
    : [
        { label: 'Rent', note: `${d.gpus} GPUs × $${m.rent.toFixed(2)} × 24 h`, value: fmtUsdInt(d.rentUsd),
          fn: s.rentBasis === 'contract' ? 'contracts-2026' : s.rack === 'gb200' ? 'coreweave-pricing' : 'verda-pricing' },
      ];
  if (i.overheadPct > 0) cost.push({ label: 'Overhead', note: `${fmtPct(i.overheadPct)} of revenue`, value: fmtUsdInt(d.overheadUsd) });
  cost.push({ label: 'Total', value: fmtUsdInt(d.costUsd), total: true });

  return (
    <section className="details" aria-label="Details">
      <h2>The day, itemized</h2>
      <table className="receipt" data-testid="receipt">
        <Block Fn={Fn} title="Capacity" unit="tok/s per GPU" rows={[
          { label: 'Measured', note: `InferenceX, ${Math.round(i.interactivity)} tok/s per user`, value: fmtInt(d.benchPerGpu), fn: model.curves[s.rack].source },
          { label: 'On this traffic', note: `${(i.islOsl * (1 - i.cacheHit)).toFixed(1)} fresh input tokens per output, ${i.refUncachedPerOut} in the benchmark`, value: fmtInt(d.capacityPerGpu) },
          { label: 'Sold', note: `${fmtPct(i.availability)} uptime × ${fmtPct(i.utilization)} utilization`, value: fmtInt(d.tpsPerGpu * i.utilization), fn: ['inferencex-tco-availability', 'utilization-pattern-2026'] },
        ]} />
        <Block Fn={Fn} title="Tokens per day" rows={[
          { label: 'Output', value: fmtTokens(d.outputTokens) },
          { label: 'Fresh input', note: `${fmtPct(1 - i.cacheHit)} of ${Math.round(i.islOsl)} per output`, value: fmtTokens(d.uncachedInputTokens) },
          { label: 'Cached input', note: fmtPct(i.cacheHit), value: fmtTokens(d.cachedInputTokens), fn: model.mix.source },
        ]} after={<>{fmtPct(share)} of all {model.short} traffic on OpenRouter</>} />
        <Block Fn={Fn} title="Revenue" unit="per day" rows={[
          { label: 'Output', note: `${exact(d.outputTokens)} × ${price(i.priceOutUsdPerM)}`, value: fmtUsdInt(d.outputRevenueUsd), fn: model.pricePresets[s.pricePreset].source },
          { label: 'Fresh input', note: `${exact(d.uncachedInputTokens)} × ${price(i.priceInUsdPerM)}`, value: fmtUsdInt(uncachedRev) },
          { label: 'Cached input', note: `${exact(d.cachedInputTokens)} × ${price(i.priceCacheUsdPerM)}`, value: fmtUsdInt(cachedRev) },
          { label: 'Total', value: fmtUsdInt(d.revenueUsd), total: true },
        ]} />
        <Block Fn={Fn} title={owning ? 'Cost of owning' : 'Cost'} unit="per day" rows={cost} />
        <tbody>
          <tr className="profit-row">
            <td className="l">{i.overheadPct > 0 ? 'Profit' : 'Gross profit'}</td>
            <td className="n">{fmtPct(d.operatingMargin)} of revenue</td>
            <td className="v">{fmtUsdInt(d.operatingProfitUsd)}</td>
          </tr>
        </tbody>
      </table>
      <p className="excluded">Not included: sales, customer support, payment fees and taxes. The overhead slider adds the first three. Figures are rounded for display; totals are computed from unrounded values.</p>

      <h2>How it works</h2>
      <ul className="method">
        <li>Throughput is InferenceX's agentic benchmark, which replays 393 Claude Code sessions {s.model === 'glm53' ? 'on GLM-5.2 (the same architecture as GLM-5.3) in NVFP4 on Dynamo SGLang' : 'on DeepSeek V4 Pro in FP4 on Dynamo vLLM and SGLang'}. Its contexts run longer than OpenRouter's average, so it leans conservative.</li>
        <li>The token mix comes from <a href={model.mix.url}>OpenRouter's {model.short} page</a>, which publishes daily prompt, completion and cached token counts across all providers. Over 30 days they work out to {model.mix.islOsl} input tokens per output token, with {fmtPct(model.mix.cacheHit)} of input served from cache (<a href={`${REPO}/blob/main/research/openrouter_ratios.py`}>calculation</a>). Prices are the {model.priceNotes.median} (low is {model.priceNotes.floor}; high is {model.priceNotes.list}).</li>
        <li>Rent is the cheapest published whole-rack list price, or a 3-year multi-rack contract at the 75th percentile of what 2026 deals are reported at.</li>
        <li>Hourly rentals can be handed back when demand falls, so they default to 70% utilization. A rack you keep for years also runs through quiet nights, weekends and slow days, so on average it sells less of its capacity: 55% by default.</li>
        <li>An owned rack's price, less its 10% resale value, is spread over 4 years as equal yearly payments that include 9% a year on the money tied up in it, the same as paying off a 9% loan. Support, operations, space and power come on top.</li>
      </ul>

      <Faq />

      <details className="fold" id="sources" data-testid="sources">
        <summary><h2>Sources ({sources.length})</h2></summary>
        <ol className="sources">
          {sources.map((id, k) => {
            const src = A.sources[id];
            return (
              <li key={id} id={`src-${k + 1}`}>
                <a href={src.url}>{src.title}</a> <span className="muted">{src.date}</span>
              </li>
            );
          })}
        </ol>
      </details>

      <footer className="footer" data-testid="disclaimer">
        <p>{DISCLAIMER}</p>
        <p className="muted">Data as of {A.version}. Source code, raw data, the model and its tests: <a href={REPO}>{REPO.replace('https://', '')}</a>.</p>
        <Cite settings={s} />
      </footer>
    </section>
  );
}
