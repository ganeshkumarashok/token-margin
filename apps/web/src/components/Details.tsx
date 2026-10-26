import { fmtInt, fmtPct, fmtTokens, fmtUsdInt } from '@gpu-roi/engine';
import { A } from '../data';
import type { Model } from '../state/useModel';

export const DISCLAIMER =
  'Personal side project. Not affiliated with, sponsored by, or representing the views of any employer or any company named here. Not financial, investment, tax, or purchasing advice. Estimates from public sources under stated assumptions; they can be wrong by large factors.';

/** Sources shown on the page, in footnote order. */
const SOURCES = [
  'inferencex-agentx', 'openrouter-glm53-activity', 'openrouter-glm53-endpoints', 'zai-pricing',
  'coreweave-pricing', 'verda-pricing', 'contracts-2026', 'semianalysis-gb200-capex', 'datagravity-nvl72-cost',
  'eia-5-6-a', 'cbre-colo', 'hf-glm-5.3',
].filter((id) => A.sources[id]);

const Fn = ({ id }: { id: string }) => {
  const n = SOURCES.indexOf(id) + 1;
  return n > 0 ? <sup><a href={`#src-${n}`}>{n}</a></sup> : null;
};

export function Details({ m }: { m: Model }) {
  const { settings: s, result, inputs: i } = m;
  const d = result.daily;
  const sc = result.schedule;
  const owning = s.tenure === 'own';
  const uncachedPerOut = i.islOsl * (1 - i.cacheHit);
  const outRev = d.outputRevenueUsd;
  const uncachedRev = (d.uncachedInputTokens * i.priceInUsdPerM) / 1e6;
  const cachedRev = d.inputRevenueUsd - uncachedRev;
  const glmShare = (d.outputTokens + d.inputTokens) / A.anchors.openrouterGlm53TokensPerDay.value;
  const decline = fmtPct(i.priceDeclinePerYear);

  return (
    <section className="details" aria-label="Details">
      <h2>The day, line by line</h2>
      <dl>
        <dt>Throughput</dt>
        <dd>
          {fmtInt(d.benchPerGpu)} output tokens/s per GPU measured at {Math.round(i.interactivity)} tok/s per user, prefill GPUs
          included<Fn id="inferencex-agentx" />; {fmtInt(d.capacityPerGpu)} on this traffic, which prefills {uncachedPerOut.toFixed(1)} uncached
          input tokens per output token against {i.refUncachedPerOut} in the benchmark. {fmtPct(i.utilization)} of that is sold.
        </dd>
        <dt>Tokens</dt>
        <dd>
          {fmtTokens(d.outputTokens)} output, {fmtTokens(d.uncachedInputTokens)} fresh input, {fmtTokens(d.cachedInputTokens)} cached input.
          That is {fmtPct(glmShare)} of all GLM-5.3 traffic on OpenRouter<Fn id="openrouter-glm53-activity" />.
        </dd>
        <dt>Revenue</dt>
        <dd>
          {fmtUsdInt(outRev)} output + {fmtUsdInt(uncachedRev)} fresh input + {fmtUsdInt(cachedRev)} cached input
          <Fn id="openrouter-glm53-endpoints" />. Input pays most of the bill because agents resend long contexts.
        </dd>
        <dt>Cost</dt>
        <dd>
          {owning ? (
            <>
              {fmtUsdInt(d.electricityUsd)} power + {fmtUsdInt(d.coloUsd)} space + {fmtUsdInt(d.otherOpexUsd)} upkeep + {fmtUsdInt(d.depreciationUsd)} wear
              on a {fmtUsdInt(d.capexUsd)} rack<Fn id="semianalysis-gb200-capex" /><Fn id="eia-5-6-a" /><Fn id="cbre-colo" />.
            </>
          ) : (
            <>
              {d.gpus} GPUs × ${m.rent.toFixed(2)}/GPU-hr × 24 h, paid whether or not the tokens sell
              <Fn id={s.rentBasis === 'contract' ? 'contracts-2026' : s.rack === 'gb200' ? 'coreweave-pricing' : 'verda-pricing'} />.
            </>
          )}
        </dd>
        <dt>Over time</dt>
        <dd data-testid="over-time">
          If token prices keep falling {decline} a year,{' '}
          {owning
            ? sc.paybackMonth
              ? `the rack pays for itself in month ${sc.paybackMonth}.`
              : 'the rack never pays for itself.'
            : sc.underwaterMonth === 1
              ? 'renting never makes money.'
              : sc.underwaterMonth
                ? `revenue drops below rent in month ${sc.underwaterMonth}, when a renter would hand the rack back with ${fmtUsdInt(sc.flows.reduce((x, y) => x + y, 0))} banked.`
                : `renting still covers rent after ${sc.months / 12} years.`}
        </dd>
      </dl>

      <h2>How it works</h2>
      <ul className="method">
        <li>Throughput is InferenceX's measured agentic benchmark: GLM-5.3 in NVFP4 on Dynamo SGLang, replaying 393 Claude Code sessions,
          because coding agents send most GLM-5.3 traffic on OpenRouter. Its traces carry about twice OpenRouter's average context,
          so the figure leans conservative.</li>
        <li>Token mix and prices come from OpenRouter: GLM-5.3's last 30 days of traffic, and the median of its 16 FP4 endpoints.</li>
        <li>Rent is the cheapest published whole-rack list price, or a 3-year multi-rack contract estimated from filed deals and 2026 increases.</li>
        <li>Everything on this page is one rack and one day. A renter pays for idle GPUs; an owner pays for the rack whether it sells or not.</li>
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
        <p className="muted">Data as of {A.version}. Raw data, the model and its tests are in the repository.</p>
      </footer>
    </section>
  );
}
