import { useEffect, useRef } from 'react';
import { A } from '../data';
import { DISCLAIMER } from './Footer';

export function AboutPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  const sources = Object.entries(A.sources).filter(([, s]) => s.kind !== 'assumption');
  return (
    <dialog ref={ref} className="about" onClose={onClose} aria-labelledby="about-title">
      <div className="about-head">
        <h2 id="about-title">About</h2>
        <button type="button" className="close" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <p className="disclaimer">{DISCLAIMER}</p>

      <h3>How it works</h3>
      <ul>
        <li><b>Capacity.</b> Output tokens/s per GPU at your serving speed, read off the published InferenceX curve for {A.model.label} ({A.model.paramsTotalB}B total, {A.model.paramsActiveB}B active, FP4, 8K in / 1K out), × achieved throughput × utilization × 72 GPUs × 86,400 s.</li>
        <li><b>Revenue.</b> Output tokens × output price, plus input tokens (input : output ratio) split into uncached and cached at their prices. Optional share at list price.</li>
        <li><b>Costs.</b> Rack price straight-line over the useful life, less resale. Electricity = IT kW × PUE × ¢/kWh, unsold capacity at idle draw. Colocation on provisioned kW. Other opex as % of capex.</li>
        <li><b>Payback.</b> Monthly cash flows; prices fall on calendar time at the decline rate. Payback = first month cumulative cash ≥ 0. NPV and IRR include resale; NPV discounts at the cost of capital.</li>
        <li><b>Token accounting.</b> Benchmark throughput is output (decode) tokens per GPU. Serving speed is decode tokens/s per user, excluding time to first token.</li>
        <li><b>Demand.</b> The tool does not model who buys the tokens. The line under the results compares the volume you sell with all of OpenRouter and with DeepSeek's published day.</li>
      </ul>

      <h3>Not modeled</h3>
      <p className="small">Taxes; staff, sales, support beyond the opex %; failures and downtime; network egress; software licenses; FP4 vs FP8 quality; SLAs and latency premiums; multi-model fleets; other uses of the rack; extra capacity from cache hits (kept at benchmark capacity, conservative); demand growth.</p>

      <h3>Known issues</h3>
      <ul className="small">
        <li>Which InferenceX points are disaggregated is not published per point; disaggregated figures are per decode GPU and overstate per-total-GPU throughput.</li>
        <li>A second InferenceX page (GB200 vs H200, Aug-2025 pricing) implies ~18× higher cost per token for GLM on GB200 than the curve used here.</li>
        <li>GLM-5.3 weekly volume on OpenRouter is not yet in the data.</li>
        <li>Z.ai publishes FP8 weights; FP4 serving adds a quantization step and some quality cost.</li>
        <li>Rack prices at volume are likely below the small-order prices used.</li>
      </ul>

      <h3>Sources</h3>
      <ul className="sources small">
        {sources.map(([id, s]) => (
          <li key={id}>
            <a href={s.url} target="_blank" rel="noreferrer noopener">{s.title}</a> <span className="muted">· {s.date}{s.kind === 'secondary' ? ' · secondary' : ''}</span>
          </li>
        ))}
      </ul>
      <p className="muted small">Data as of {A.version}.</p>
    </dialog>
  );
}
