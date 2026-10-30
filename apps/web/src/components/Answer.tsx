import { fmtInt, fmtPct, fmtTokens, fmtUsdInt } from '@token-margin/engine';
import { A } from '../data';
import type { Model } from '../state/useModel';
import { useTween } from '../state/useTween';
import { ProfitChart } from './ProfitChart';

/** Martian Mono sets commas a full cell wide; tuck them in so $23,309 reads as one number. */
function Tight({ text }: { text: string }) {
  return <>{text.split(/(,)/).map((part, k) => (part === ',' ? <span key={k} className="cm">,</span> : part))}</>;
}

/** A figure in the equation. The stylesheet sizes it to its column from the glyph count, so a longer figure never widens its term. */
function Big({ text, className = '', testId }: { text: string; className?: string; testId: string }) {
  return (
    <span className={`big${className ? ` ${className}` : ''}`} style={{ '--glyphs': text.length } as React.CSSProperties} data-testid={testId}>
      <Tight text={text} />
    </span>
  );
}

export function Answer({ m }: { m: Model }) {
  const { settings: s, result, inputs: i } = m;
  const d = result.daily;
  const rack = A.racks[s.rack];
  const owning = s.tenure === 'own';
  const gross = i.overheadPct === 0;
  // Per GPU-hour: tokens sold, what each million output tokens (with its input) sells for, and what the GPU costs.
  const soldNow = d.tpsPerGpu * i.utilization;
  const perMOutNow = d.outputTokens > 0 ? d.revenueUsd / (d.outputTokens / 1e6) : 0;
  const perGpuHrNow = d.revenueUsd / (d.gpus * 24);
  const costPerGpuHrNow = (d.costUsd - d.overheadUsd) / (d.gpus * 24);
  // The figures glide to each new setting rather than snapping to it.
  const [revenue, cost, overhead, profit, margin, outTokens, inTokens, sold, perMOut, perGpuHr, costPerGpuHr] = useTween([
    d.revenueUsd, d.costUsd - d.overheadUsd, d.overheadUsd, d.operatingProfitUsd, d.operatingMargin ?? 0, d.outputTokens, d.inputTokens,
    soldNow, perMOutNow, perGpuHrNow, costPerGpuHrNow,
  ]);
  const loss = profit < 0;
  const costNote = owning
    ? `${fmtUsdInt(cost / 24)}/hr all-in, owned`
    : `${fmtUsdInt(m.rent * rack.gpus)}/hr ${s.rentBasis === 'contract' ? '3-yr contract' : 'on demand, hard to buy'}`;

  return (
    <section className="answer" aria-label="One day">
      <p className="lede">
        One <span className="nb">{rack.label}</span> rack serving <span className="nb">{A.models[s.model].label}</span> for a day at {Math.round(i.interactivity)} tokens/s per user.
      </p>

      <div className="eq" data-testid="equation">
        <div className="term">
          <Big text={fmtUsdInt(revenue)} testId="revenue" />
          <span className="sub">revenue</span>
          <span className="note">{fmtTokens(outTokens)} out · {fmtTokens(inTokens)} in</span>
        </div>
        <span className="op" aria-hidden>−</span>
        <div className="term">
          <Big text={fmtUsdInt(cost)} testId="cost" />
          <span className="sub">{owning ? 'cost of owning' : 'rent'}</span>
          <span className="note">{costNote}</span>
        </div>
        <span className="op" aria-hidden>−</span>
        <div className="term">
          <Big text={fmtUsdInt(overhead)} testId="overhead" />
          <span className="sub">overhead</span>
          <span className="note">{fmtPct(i.overheadPct)} of revenue</span>
        </div>
        <span className="op" aria-hidden>=</span>
        <div className="term">
          <Big text={fmtUsdInt(profit)} className={`profit${loss ? ' loss' : ''}`} testId="profit" />
          <span className="sub">{gross ? (loss ? 'gross loss' : 'gross profit') : loss ? 'loss' : 'profit'}</span>
          <span className="note" data-testid="margin">{fmtPct(margin)} {gross ? 'gross margin' : 'margin'}</span>
        </div>
      </div>

      <ProfitChart m={m} />

      <p className="unit-line" data-testid="unit-line">
        Each GPU sells <b>{fmtInt(sold)}</b> output tokens/s at <b>${perMOut.toFixed(2)}</b> per million, input included:{' '}
        <b>${perGpuHr.toFixed(2)}</b> an hour against <b>${costPerGpuHr.toFixed(2)}</b> {owning ? 'all-in to own' : 'rent'}.
        Each user sees {Math.round(i.interactivity)} tok/s, what OpenRouter calls throughput.
      </p>
    </section>
  );
}
