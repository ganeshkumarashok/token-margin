import { fmtInt, fmtPct, fmtTokens, fmtUsdInt } from '@token-margin/engine';
import { A } from '../data';
import type { Model } from '../state/useModel';

export const REPO = 'https://github.com/ganeshkumarashok/token-margin';

export const DISCLAIMER =
  'Personal side project. Not affiliated with, sponsored by, or representing the views of any employer or any company named here. Not financial, investment, tax, or purchasing advice. Estimates from public sources under stated assumptions; they can be wrong by large factors.';

/** Sources shown on the page, in footnote order. */
const SOURCES = [
  'inferencex-agentx', 'openrouter-glm53-activity', 'openrouter-glm53-endpoints', 'zai-pricing',
  'coreweave-pricing', 'verda-pricing', 'contracts-2026', 'semianalysis-gb200-capex', 'datagravity-nvl72-cost',
  'eia-5-6-a', 'cbre-colo', 'owning-opex-2026', 'inferencex-tco-availability', 'hf-glm-5.3',
].filter((id) => A.sources[id]);

/** Footnote marks; several sources share one superscript, comma-separated. */
const Fn = ({ id }: { id: string | string[] }) => {
  const ns = (Array.isArray(id) ? id : [id]).map((x) => SOURCES.indexOf(x) + 1).filter((n) => n > 0);
  if (!ns.length) return null;
  return <sup>{ns.map((n, k) => <span key={n}>{k > 0 ? ',' : ''}<a href={`#src-${n}`}>{n}</a></span>)}</sup>;
};

export function Details({ m }: { m: Model }) {
  const { settings: s, result, inputs: i } = m;
  const d = result.daily;
  const owning = s.tenure === 'own';
  const uncachedPerOut = i.islOsl * (1 - i.cacheHit);
  const outRev = d.outputRevenueUsd;
  const uncachedRev = (d.uncachedInputTokens * i.priceInUsdPerM) / 1e6;
  const cachedRev = d.inputRevenueUsd - uncachedRev;
  const glmShare = (d.outputTokens + d.inputTokens) / A.anchors.openrouterGlm53TokensPerDay.value;

  return (
    <section className="details" aria-label="Details">
      <h2>The day, line by line</h2>
      <dl>
        <dt>Throughput</dt>
        <dd>
          {fmtInt(d.benchPerGpu)} output tokens/s per GPU at {Math.round(i.interactivity)} tok/s per user in InferenceX's measurements, prefill GPUs
          included<Fn id="inferencex-agentx" />; {fmtInt(d.capacityPerGpu)} on this traffic, which prefills {uncachedPerOut.toFixed(1)} uncached
          input tokens per output token against {i.refUncachedPerOut} in the benchmark. The rack is up {fmtPct(i.availability)} of the time (one failure every 24 days, 12 hours to recover)<Fn id="inferencex-tco-availability" />, and at {fmtPct(i.utilization)} utilization it sells {fmtInt(d.tpsPerGpu * i.utilization)} per GPU.
        </dd>
        <dt>Tokens</dt>
        <dd>
          {fmtTokens(d.outputTokens)} output, {fmtTokens(d.uncachedInputTokens)} fresh input, {fmtTokens(d.cachedInputTokens)} cached input.
          That is {fmtPct(glmShare)} of all GLM-5.3 traffic on OpenRouter<Fn id="openrouter-glm53-activity" />.
        </dd>
        <dt>Revenue</dt>
        <dd>
          {fmtUsdInt(outRev)} output + {fmtUsdInt(uncachedRev)} fresh input + {fmtUsdInt(cachedRev)} cached input
          <Fn id={A.pricePresets[s.pricePreset].source} />. Input pays most of the bill because agents resend long contexts.
        </dd>
        <dt>Cost</dt>
        <dd>
          {owning ? (
            <>
              {fmtUsdInt(d.electricityUsd)} power + {fmtUsdInt(d.coloUsd)} space + {fmtUsdInt(d.otherOpexUsd)} support and spares + {fmtUsdInt(d.opsUsd)} operations + {fmtUsdInt(d.depreciationUsd)} wear
              on a ${(d.capexUsd / 1e6).toFixed(1)}M rack<Fn id={[A.racks[s.rack].priceUsd.source, 'eia-5-6-a', 'cbre-colo', 'owning-opex-2026']} />.
            </>
          ) : (
            <>
              {d.gpus} GPUs × ${m.rent.toFixed(2)}/GPU-hr × 24 h, paid whether or not the tokens sell
              <Fn id={s.rentBasis === 'contract' ? 'contracts-2026' : s.rack === 'gb200' ? 'coreweave-pricing' : 'verda-pricing'} />.
            </>
          )}
          {i.overheadPct > 0
            ? <> Overhead adds {fmtUsdInt(d.overheadUsd)} ({fmtPct(i.overheadPct)} of revenue).</>
            : <> Staff, sales, support and payment fees are not included; the overhead slider adds them.</>}
        </dd>
      </dl>

      <h2>How it works</h2>
      <ul className="method">
        <li>Throughput is InferenceX's measured agentic benchmark: GLM-5.2, which has the same architecture as GLM-5.3, in NVFP4 on Dynamo SGLang, replaying 393 Claude Code sessions,
          because coding agents send most GLM-5.3 traffic on OpenRouter. Its traces carry about twice OpenRouter's average context,
          so the figure leans conservative.</li>
        <li>The token mix is GLM-5.3's last 30 days of traffic on OpenRouter. Prices are the median of its 16 FP4 endpoints, the cheapest mainstream FP4 price (low, DeepInfra), or the list price most large providers charge (high, the same as Z.ai's). Cached input is billed at the lower cache-read price.</li>
        <li>Rent is the cheapest published whole-rack list price, or a 3-year multi-rack contract estimated from filed deals and 2026 increases.</li>
        <li>Everything on this page is one rack and one day. A renter pays for unused capacity, and an owner pays for the rack whether it sells or not.</li>
      </ul>

      <h2>Sources</h2>
      <ol className="sources">
        {SOURCES.map((id, k) => {
          const src = A.sources[id];
          return (
            <li key={id} id={`src-${k + 1}`}>
              <a href={src.url}>{src.title}</a> <span className="muted">{src.date}</span>
            </li>
          );
        })}
      </ol>

      <footer className="footer" data-testid="disclaimer">
        <p>{DISCLAIMER}</p>
        <p className="muted">Data as of {A.version}. Source code, raw data, the model and its tests: <a href={REPO}>{REPO.replace('https://', '')}</a>.</p>
      </footer>
    </section>
  );
}
